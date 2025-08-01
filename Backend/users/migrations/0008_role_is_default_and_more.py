# Generated by Django 4.2.7 on 2025-07-27 00:10

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0007_rename_decsription_role_description'),
    ]

    operations = [
        migrations.AddField(
            model_name='role',
            name='is_default',
            field=models.BooleanField(default=False, help_text='Is this the default role for new users?'),
        ),
        migrations.AddIndex(
            model_name='permission',
            index=models.Index(fields=['codename'], name='users_permi_codenam_6a0575_idx'),
        ),
        migrations.AddIndex(
            model_name='permissionlog',
            index=models.Index(fields=['timestamp'], name='users_permi_timesta_879f6a_idx'),
        ),
        migrations.AddIndex(
            model_name='role',
            index=models.Index(fields=['name', 'is_active'], name='users_role_name_cd4d31_idx'),
        ),
        migrations.AddIndex(
            model_name='userrole',
            index=models.Index(fields=['user', 'is_active'], name='users_userr_user_id_6be9a3_idx'),
        ),
        migrations.AddIndex(
            model_name='userrole',
            index=models.Index(fields=['role', 'is_active'], name='users_userr_role_id_3052a3_idx'),
        ),
        migrations.AddIndex(
            model_name='userrole',
            index=models.Index(fields=['expires_at'], name='users_userr_expires_070b53_idx'),
        ),
    ]
