from django.contrib import admin
from .models import AIGenerationLog


@admin.register(AIGenerationLog)
class AIGenerationLogAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "request_type",
        "model_name",
        "is_successful",
        "prompt_tokens",
        "completion_tokens",
        "created_at",
    )
    list_filter = ("request_type", "is_successful", "model_name", "created_at")
    search_fields = ("user__email", "input_context", "response_text", "error_message")
    readonly_fields = ("created_at",)
