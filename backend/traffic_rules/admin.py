from django.contrib import admin
from .models import RuleDocument, RuleSection, RulePoint


class RulePointInline(admin.TabularInline):
    model = RulePoint
    extra = 0
    fields = ("number", "order", "is_active", "text")


@admin.register(RuleDocument)
class RuleDocumentAdmin(admin.ModelAdmin):
    list_display = ("title", "document_number", "edition_date", "is_active", "version")
    list_filter = ("is_active", "edition_date")
    search_fields = ("title", "document_number")


@admin.register(RuleSection)
class RuleSectionAdmin(admin.ModelAdmin):
    list_display = ("number", "title", "document", "order")
    list_filter = ("document",)
    search_fields = ("title",)
    inlines = [RulePointInline]


@admin.register(RulePoint)
class RulePointAdmin(admin.ModelAdmin):
    list_display = ("number", "section", "order", "is_active")
    list_filter = ("section__document", "section", "is_active")
    search_fields = ("number", "text")
