from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


class AuthAndUserAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="ivan@example.com",
            password="StrongPassword123!",
            first_name="Іван",
            last_name="Франко",
        )
        self.other_user = User.objects.create_user(
            email="taras@example.com",
            password="StrongPassword123!",
            first_name="Тарас",
            last_name="Шевченко",
        )
        self.register_url = reverse("users:register")
        self.login_url = reverse("users:login")
        self.refresh_url = reverse("users:token-refresh")
        self.profile_url = reverse("users:profile")
        self.change_password_url = reverse("users:change-password")

    def test_registration_success(self):
        payload = {
            "email": "lesya@example.com",
            "password": "StrongPassword123!",
            "password_confirm": "StrongPassword123!",
            "first_name": "Леся",
            "last_name": "Українка",
        }
        response = self.client.post(self.register_url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("tokens", response.data)
        self.assertIn("access", response.data["tokens"])
        self.assertIn("refresh", response.data["tokens"])
        self.assertEqual(response.data["user"]["email"], "lesya@example.com")

        # Перевірка хешування пароля в базі
        new_user = User.objects.get(email="lesya@example.com")
        self.assertTrue(new_user.check_password("StrongPassword123!"))

    def test_registration_duplicate_email_fails(self):
        payload = {
            "email": "IVAN@example.com",  # регістронезалежність
            "password": "StrongPassword123!",
            "password_confirm": "StrongPassword123!",
        }
        response = self.client.post(self.register_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_registration_passwords_mismatch_fails(self):
        payload = {
            "email": "mismatch@example.com",
            "password": "StrongPassword123!",
            "password_confirm": "DifferentPassword123!",
        }
        response = self.client.post(self.register_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password_confirm", response.data)

    def test_login_success(self):
        payload = {
            "email": "ivan@example.com",
            "password": "StrongPassword123!",
        }
        response = self.client.post(self.login_url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertEqual(response.data["user"]["email"], "ivan@example.com")

    def test_login_invalid_credentials(self):
        payload = {
            "email": "ivan@example.com",
            "password": "WrongPassword!",
        }
        response = self.client.post(self.login_url, payload)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_refresh(self):
        login_resp = self.client.post(
            self.login_url,
            {"email": "ivan@example.com", "password": "StrongPassword123!"},
        )
        refresh_token = login_resp.data["refresh"]

        refresh_resp = self.client.post(self.refresh_url, {"refresh": refresh_token})
        self.assertEqual(refresh_resp.status_code, status.HTTP_200_OK)
        self.assertIn("access", refresh_resp.data)

    def test_profile_unauthorized_access_denied(self):
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_authorized_returns_own_data(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "ivan@example.com")
        self.assertEqual(response.data["first_name"], "Іван")

    def test_profile_update_successful(self):
        self.client.force_authenticate(user=self.user)
        payload = {"first_name": "Іван-Оновлений", "last_name": "Каменяр"}
        response = self.client.patch(self.profile_url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "Іван-Оновлений")
        self.assertEqual(self.user.last_name, "Каменяр")

    def test_change_password_flow(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "old_password": "StrongPassword123!",
            "new_password": "NewUltraPassword456!",
            "new_password_confirm": "NewUltraPassword456!",
        }
        response = self.client.post(self.change_password_url, payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewUltraPassword456!"))

    def test_change_password_wrong_old_password_fails(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "old_password": "IncorrectOldPassword",
            "new_password": "NewUltraPassword456!",
            "new_password_confirm": "NewUltraPassword456!",
        }
        response = self.client.post(self.change_password_url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
