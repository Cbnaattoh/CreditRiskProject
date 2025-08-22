"""
Advanced Settings Management Views
Enterprise-grade user settings, preferences, and session management
"""

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.contrib.sessions.models import Session
from django.utils import timezone
from django.db.models import Count, Q, Max, Avg
from django.core.cache import cache
from datetime import timedelta, datetime
import logging

from .models import (
    User, UserProfile, UserPreferences, UserSession, 
    SecurityEvent, LoginHistory
)
from .serializers import (
    UserPreferencesSerializer, UserSessionSerializer, SecurityEventSerializer,
    EnhancedUserProfileSerializer, SettingsOverviewSerializer,
    BulkPreferencesUpdateSerializer
)
from .permissions import RequirePermission

logger = logging.getLogger(__name__)


class UserPreferencesViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user preferences and settings
    Supports CRUD operations and bulk updates
    """
    serializer_class = UserPreferencesSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return user's own preferences only"""
        return UserPreferences.objects.filter(user=self.request.user)
    
    def get_object(self):
        """Get or create user preferences"""
        preferences, created = UserPreferences.objects.get_or_create(
            user=self.request.user
        )
        if created:
            # Log creation event
            SecurityEvent.objects.create(
                user=self.request.user,
                event_type='preferences_update',
                severity='low',
                description='User preferences initialized',
                ip_address=self.get_client_ip(),
                user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
                metadata={'action': 'created'}
            )
        return preferences
    
    def get_client_ip(self):
        """Get client IP address"""
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return self.request.META.get('REMOTE_ADDR')
    
    def perform_update(self, serializer):
        """Log preference updates"""
        old_values = {}
        instance = self.get_object()
        
        # Capture old values for audit
        for field in ['theme', 'language', 'timezone', 'session_timeout']:
            old_values[field] = getattr(instance, field, None)
        
        # Save the update
        serializer.save(user=self.request.user)
        
        # Log security event for sensitive changes
        new_values = serializer.validated_data
        sensitive_fields = ['session_timeout', 'security_alerts', 'activity_tracking']
        
        for field in sensitive_fields:
            if field in new_values and field in old_values:
                if new_values[field] != old_values[field]:
                    SecurityEvent.objects.create(
                        user=self.request.user,
                        event_type='preferences_update',
                        severity='medium',
                        description=f'Security preference changed: {field}',
                        ip_address=self.get_client_ip(),
                        user_agent=self.request.META.get('HTTP_USER_AGENT', ''),
                        metadata={
                            'field': field,
                            'old_value': old_values[field],
                            'new_value': new_values[field]
                        }
                    )
    
    @action(detail=False, methods=['patch'])
    def update_my_preferences(self, request):
        """Update current user's preferences (get or create)"""
        preferences = self.get_object()
        serializer = self.get_serializer(preferences, data=request.data, partial=True)
        
        if serializer.is_valid():
            # Capture old values for audit
            old_values = {}
            for field in ['theme', 'language', 'timezone', 'session_timeout']:
                old_values[field] = getattr(preferences, field, None)
            
            # Save the update
            serializer.save(user=request.user)
            
            # Log security event for sensitive changes
            new_values = serializer.validated_data
            sensitive_fields = ['session_timeout', 'security_alerts', 'activity_tracking']
            
            for field in sensitive_fields:
                if field in new_values and field in old_values:
                    if new_values[field] != old_values[field]:
                        SecurityEvent.objects.create(
                            user=request.user,
                            event_type='preferences_update',
                            severity='medium',
                            description=f'Security preference changed: {field}',
                            ip_address=self.get_client_ip(),
                            user_agent=request.META.get('HTTP_USER_AGENT', ''),
                            metadata={
                                'field': field,
                                'old_value': old_values[field],
                                'new_value': new_values[field]
                            }
                        )
            
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['patch'])
    def bulk_update(self, request):
        """Bulk update multiple preferences"""
        serializer = BulkPreferencesUpdateSerializer(data=request.data)
        if serializer.is_valid():
            preferences = self.get_object()
            preferences_data = serializer.validated_data['preferences']
            
            # Update regular model fields
            for field, value in preferences_data.items():
                if hasattr(preferences, field) and not field.startswith('custom_'):
                    setattr(preferences, field, value)
            
            # Handle custom settings
            custom_fields = {k: v for k, v in preferences_data.items() if k.startswith('custom_')}
            if custom_fields:
                if not preferences.custom_settings:
                    preferences.custom_settings = {}
                preferences.custom_settings.update(custom_fields)
            
            preferences.save()
            
            # Log bulk update
            SecurityEvent.objects.create(
                user=request.user,
                event_type='preferences_update',
                severity='medium',
                description='Bulk preferences update',
                ip_address=self.get_client_ip(),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                metadata={'updated_fields': list(preferences_data.keys())}
            )
            
            return Response(
                UserPreferencesSerializer(preferences).data,
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def reset_to_defaults(self, request):
        """Reset preferences to default values"""
        preferences = self.get_object()
        
        # Reset to defaults
        preferences.theme = 'light'
        preferences.language = 'en'
        preferences.timezone = 'UTC'
        preferences.compact_view = False
        preferences.animations_enabled = True
        preferences.email_notifications = True
        preferences.push_notifications = True
        preferences.security_alerts = True
        preferences.auto_save = True
        preferences.session_timeout = 30
        preferences.custom_settings = {}
        
        preferences.save()
        
        # Log reset event
        SecurityEvent.objects.create(
            user=request.user,
            event_type='preferences_update',
            severity='medium',
            description='Preferences reset to defaults',
            ip_address=self.get_client_ip(),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            metadata={'action': 'reset_to_defaults'}
        )
        
        return Response(
            {'message': 'Preferences reset to defaults successfully'},
            status=status.HTTP_200_OK
        )


class UserSessionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for managing user sessions
    Supports viewing and terminating sessions
    """
    serializer_class = UserSessionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return user's active sessions"""
        return UserSession.objects.filter(
            user=self.request.user,
            is_active=True
        ).order_by('-last_activity')
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get current session information"""
        session_key = request.session.session_key
        if session_key:
            try:
                session = UserSession.objects.get(
                    user=request.user,
                    session_key=session_key,
                    is_active=True
                )
                return Response(
                    UserSessionSerializer(session, context={'request': request}).data
                )
            except UserSession.DoesNotExist:
                pass
        
        return Response(
            {'message': 'Current session not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    @action(detail=True, methods=['post'])
    def terminate(self, request, pk=None):
        """Terminate a specific session"""
        session = get_object_or_404(
            UserSession,
            pk=pk,
            user=request.user,
            is_active=True
        )
        
        # Don't allow terminating current session via this endpoint
        if session.session_key == request.session.session_key:
            return Response(
                {'error': 'Cannot terminate current session via this endpoint'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        session.terminate(by_user=True)
        
        # Also terminate the Django session
        try:
            django_session = Session.objects.get(session_key=session.session_key)
            django_session.delete()
        except Session.DoesNotExist:
            pass
        
        # Log termination event
        SecurityEvent.objects.create(
            user=request.user,
            event_type='session_terminated',
            severity='medium',
            description=f'Session terminated manually',
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            session=session,
            metadata={
                'terminated_session_id': str(session.id),
                'device_type': session.device_type,
                'location': session.location
            }
        )
        
        return Response(
            {'message': 'Session terminated successfully'},
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['post'])
    def terminate_all_others(self, request):
        """Terminate all other sessions except current"""
        current_session_key = request.session.session_key
        
        # Get all other active sessions
        other_sessions = UserSession.objects.filter(
            user=request.user,
            is_active=True
        ).exclude(session_key=current_session_key)
        
        terminated_count = 0
        for session in other_sessions:
            session.terminate(by_user=True)
            
            # Delete Django session
            try:
                django_session = Session.objects.get(session_key=session.session_key)
                django_session.delete()
            except Session.DoesNotExist:
                pass
            
            terminated_count += 1
        
        # Log mass termination event
        SecurityEvent.objects.create(
            user=request.user,
            event_type='session_terminated',
            severity='high',
            description=f'All other sessions terminated',
            ip_address=self.get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            metadata={
                'terminated_count': terminated_count,
                'action': 'terminate_all_others'
            }
        )
        
        return Response(
            {'message': f'{terminated_count} sessions terminated successfully'},
            status=status.HTTP_200_OK
        )
    
    @staticmethod
    def get_client_ip(request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')


class SecurityEventViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing security events and audit logs
    """
    serializer_class = SecurityEventSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return user's security events"""
        return SecurityEvent.objects.filter(
            user=self.request.user
        ).order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent security events (last 30 days)"""
        thirty_days_ago = timezone.now() - timedelta(days=30)
        events = self.get_queryset().filter(
            created_at__gte=thirty_days_ago
        )[:50]  # Limit to 50 recent events
        
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get security events summary statistics"""
        queryset = self.get_queryset()
        
        # Get counts by event type and severity
        event_summary = queryset.values('event_type').annotate(
            count=Count('id')
        ).order_by('-count')
        
        severity_summary = queryset.values('severity').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Recent activity (last 7 days)
        week_ago = timezone.now() - timedelta(days=7)
        recent_activity = queryset.filter(
            created_at__gte=week_ago
        ).count()
        
        return Response({
            'total_events': queryset.count(),
            'recent_activity': recent_activity,
            'by_event_type': list(event_summary),
            'by_severity': list(severity_summary),
            'unresolved_count': queryset.filter(resolved=False).count()
        })


class SettingsOverviewViewSet(viewsets.ViewSet):
    """
    ViewSet for settings overview dashboard
    """
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        """Get comprehensive settings overview"""
        user = request.user
        
        # Get or create user preferences and profile
        preferences, _ = UserPreferences.objects.get_or_create(user=user)
        profile, _ = UserProfile.objects.get_or_create(user=user)
        
        # Calculate metrics
        profile_completion = profile.calculate_completion_score()
        
        # Security score calculation
        security_factors = []
        
        # MFA enabled
        if user.is_mfa_fully_configured:
            security_factors.append(25)
        
        # Recent password change
        if user.last_password_change:
            days_since_change = (timezone.now() - user.last_password_change).days
            if days_since_change <= 90:
                security_factors.append(25)
            elif days_since_change <= 180:
                security_factors.append(15)
        
        # Security alerts enabled
        if preferences.security_alerts:
            security_factors.append(15)
        
        # Session timeout configured
        if preferences.session_timeout <= 60:  # 1 hour or less
            security_factors.append(10)
        
        # Profile completeness bonus
        if profile_completion >= 80:
            security_factors.append(15)
        
        # Activity tracking enabled (helps with security monitoring)
        if preferences.activity_tracking:
            security_factors.append(10)
        
        security_score = min(sum(security_factors), 100)
        
        # Active sessions count
        active_sessions = UserSession.objects.filter(
            user=user,
            is_active=True
        ).count()
        
        # Recent security events count (last 7 days)
        week_ago = timezone.now() - timedelta(days=7)
        recent_security_events = SecurityEvent.objects.filter(
            user=user,
            created_at__gte=week_ago
        ).count()
        
        # Preferences configuration level
        configured_count = 0
        total_count = 15  # Total preference fields
        
        for field in ['theme', 'language', 'timezone', 'date_format', 'time_format']:
            if getattr(preferences, field, None) and getattr(preferences, field) != 'auto':
                configured_count += 1
        
        for field in ['email_notifications', 'push_notifications', 'security_alerts', 
                     'auto_save', 'activity_tracking', 'compact_view', 'animations_enabled']:
            if getattr(preferences, field, None) is not None:
                configured_count += 1
        
        if preferences.custom_settings:
            configured_count += min(len(preferences.custom_settings), 3)
        
        preferences_configured = min(int((configured_count / total_count) * 100), 100)
        
        # Build overview data
        overview_data = {
            'profile_completion': profile_completion,
            'security_score': security_score,
            'active_sessions': active_sessions,
            'recent_security_events': recent_security_events,
            'mfa_enabled': user.is_mfa_fully_configured,
            'last_password_change': user.last_password_change,
            'preferences_configured': preferences_configured,
            
            # Quick settings preview
            'current_theme': preferences.theme,
            'notification_status': 'enabled' if preferences.push_notifications else 'disabled',
            'language_preference': preferences.language,
            'auto_save_enabled': preferences.auto_save,
        }
        
        serializer = SettingsOverviewSerializer(overview_data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def recommendations(self, request):
        """Get personalized settings recommendations"""
        user = request.user
        preferences, _ = UserPreferences.objects.get_or_create(user=user)
        profile, _ = UserProfile.objects.get_or_create(user=user)
        
        recommendations = []
        
        # Security recommendations
        if not user.is_mfa_fully_configured:
            recommendations.append({
                'type': 'security',
                'priority': 'high',
                'title': 'Enable Multi-Factor Authentication',
                'description': 'Secure your account with an additional layer of protection',
                'action': 'setup_mfa',
                'category': 'Security'
            })
        
        # Profile completion recommendations
        profile_completion = profile.calculate_completion_score()
        if profile_completion < 70:
            recommendations.append({
                'type': 'profile',
                'priority': 'medium',
                'title': 'Complete Your Profile',
                'description': f'Your profile is {profile_completion}% complete. Add more information for better experience',
                'action': 'complete_profile',
                'category': 'Profile'
            })
        
        # Session timeout recommendation
        if preferences.session_timeout > 120:  # More than 2 hours
            recommendations.append({
                'type': 'security',
                'priority': 'medium',
                'title': 'Reduce Session Timeout',
                'description': 'Consider reducing session timeout for better security',
                'action': 'adjust_session_timeout',
                'category': 'Security'
            })
        
        # Notification optimization
        if not preferences.security_alerts:
            recommendations.append({
                'type': 'security',
                'priority': 'medium',
                'title': 'Enable Security Alerts',
                'description': 'Stay informed about security events on your account',
                'action': 'enable_security_alerts',
                'category': 'Notifications'
            })
        
        return Response({
            'recommendations': recommendations,
            'total_count': len(recommendations),
            'high_priority_count': len([r for r in recommendations if r['priority'] == 'high'])
        })
    
    @action(detail=False, methods=['get'])
    def credit_worthiness_index(self, request):
        """Get Credit Worthiness Index for enterprise account evaluation"""
        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)
        
        # Calculate profile completion score
        profile_completion = profile.calculate_completion_score()
        
        # Weighted Credit Worthiness Index calculation
        # Profile Data (40% weight) - completeness of financial/professional info
        profile_weight = profile_completion * 0.4
        
        # Identity Verification (30% weight) - KYC compliance
        identity_weight = 25 * 0.3 if user.is_verified else 0
        
        # Security Level (20% weight) - MFA and authentication
        security_weight = 20 * 0.2 if user.mfa_enabled else 0
        
        # Government ID (10% weight) - Ghana Card verification
        govt_id_weight = 15 * 0.1 if user.ghana_card_number else 0
        
        # Calculate final credit index (0-100)
        credit_index = min(round(profile_weight + identity_weight + security_weight + govt_id_weight), 100)
        
        # Determine credit tier
        if credit_index >= 80:
            credit_tier = 'excellent'
            tier_label = 'Excellent'
            risk_category = 'low'
        elif credit_index >= 60:
            credit_tier = 'good'
            tier_label = 'Good'
            risk_category = 'medium'
        else:
            credit_tier = 'developing'
            tier_label = 'Developing'
            risk_category = 'high'
        
        # Factor breakdown for transparency
        factors = {
            'profile_data': {
                'score': profile_completion,
                'weight': 40,
                'contribution': round(profile_weight),
                'status': 'complete' if profile_completion >= 80 else 'incomplete'
            },
            'identity_verified': {
                'verified': user.is_verified,
                'weight': 30,
                'contribution': round(identity_weight / 0.3) if identity_weight > 0 else 0,
                'status': 'verified' if user.is_verified else 'pending'
            },
            'security_level': {
                'mfa_enabled': user.mfa_enabled,
                'weight': 20,
                'contribution': round(security_weight / 0.2) if security_weight > 0 else 0,
                'status': 'high' if user.mfa_enabled else 'standard'
            },
            'government_id': {
                'provided': bool(user.ghana_card_number),
                'weight': 10,
                'contribution': round(govt_id_weight / 0.1) if govt_id_weight > 0 else 0,
                'status': 'provided' if user.ghana_card_number else 'missing'
            }
        }
        
        return Response({
            'credit_index': credit_index,
            'credit_tier': credit_tier,
            'tier_label': tier_label,
            'risk_category': risk_category,
            'factors': factors,
            'last_updated': timezone.now().isoformat(),
            'recommendations': self._get_credit_recommendations(user, profile, factors)
        })
    
    @action(detail=False, methods=['get'])
    def compliance_status(self, request):
        """Get Account Compliance Status for regulatory requirements"""
        user = request.user
        profile, _ = UserProfile.objects.get_or_create(user=user)
        preferences, _ = UserPreferences.objects.get_or_create(user=user)
        
        # Calculate profile completion
        profile_completion = profile.calculate_completion_score()
        
        # Compliance checks
        kyc_verification = {
            'status': user.is_verified,
            'required': True,
            'weight': 35
        }
        
        data_completeness = {
            'status': profile_completion >= 70,
            'score': profile_completion,
            'threshold': 70,
            'required': True,
            'weight': 30
        }
        
        security_standards = {
            'status': user.mfa_enabled,
            'mfa_enabled': user.mfa_enabled,
            'password_strength': bool(user.last_password_change),
            'required': True,
            'weight': 35
        }
        
        # Overall compliance calculation
        compliance_score = 0
        if kyc_verification['status']:
            compliance_score += kyc_verification['weight']
        if data_completeness['status']:
            compliance_score += data_completeness['weight']
        else:
            # Partial credit for data completeness
            compliance_score += (profile_completion * 0.3)
        if security_standards['status']:
            compliance_score += security_standards['weight']
        
        compliance_score = min(compliance_score, 100)
        
        # Determine overall compliance status
        if compliance_score >= 90:
            overall_status = 'compliant'
            status_label = 'COMPLIANT'
            status_color = 'green'
        elif compliance_score >= 70:
            overall_status = 'mostly_compliant'
            status_label = 'MOSTLY COMPLIANT'
            status_color = 'amber'
        else:
            overall_status = 'pending'
            status_label = 'PENDING'
            status_color = 'red'
        
        return Response({
            'overall_status': overall_status,
            'status_label': status_label,
            'status_color': status_color,
            'compliance_score': round(compliance_score),
            'checks': {
                'kyc_verification': kyc_verification,
                'data_completeness': data_completeness,
                'security_standards': security_standards
            },
            'last_updated': timezone.now().isoformat(),
            'next_review_due': (timezone.now() + timedelta(days=90)).isoformat()
        })
    
    @action(detail=False, methods=['get'])
    def activity_analytics(self, request):
        """Get Activity Analytics for behavioral insights"""
        user = request.user
        
        # Calculate account age
        account_age_days = (timezone.now() - user.date_joined).days if user.date_joined else 0
        
        # Format account age
        if account_age_days < 30:
            account_age = f"{account_age_days} days"
        elif account_age_days < 365:
            account_age = f"{account_age_days // 30} months"
        else:
            account_age = f"{account_age_days // 365} years"
        
        # Calculate last activity
        last_login_info = {
            'date': user.last_login.isoformat() if user.last_login else None,
            'days_since': None,
            'display': 'NEW',
            'pattern': 'new_user',
            'pattern_label': 'New User',
            'pattern_color': 'gray'
        }
        
        if user.last_login:
            days_since = (timezone.now() - user.last_login).days
            last_login_info.update({
                'days_since': days_since,
                'display': 'TODAY' if days_since == 0 else f"{days_since}D AGO" if days_since <= 7 else f"{days_since // 7}W AGO" if days_since <= 30 else f"{days_since // 30}M AGO"
            })
            
            # Determine login pattern
            if days_since <= 1:
                last_login_info.update({
                    'pattern': 'active',
                    'pattern_label': 'Active',
                    'pattern_color': 'green'
                })
            elif days_since <= 7:
                last_login_info.update({
                    'pattern': 'regular',
                    'pattern_label': 'Regular',
                    'pattern_color': 'amber'
                })
            else:
                last_login_info.update({
                    'pattern': 'dormant',
                    'pattern_label': 'Dormant',
                    'pattern_color': 'red'
                })
        
        # Calculate risk level
        risk_factors = []
        if not user.mfa_enabled:
            risk_factors.append('no_mfa')
        if not user.is_verified:
            risk_factors.append('unverified')
        if user.last_login and (timezone.now() - user.last_login).days > 30:
            risk_factors.append('inactive')
        
        if len(risk_factors) == 0:
            risk_level = 'low'
            risk_label = 'Low'
            risk_color = 'green'
        elif len(risk_factors) <= 1:
            risk_level = 'medium'
            risk_label = 'Medium'
            risk_color = 'amber'
        else:
            risk_level = 'high'
            risk_label = 'High'
            risk_color = 'red'
        
        # Generate insights message
        if not user.last_login:
            insight_message = 'Welcome! Complete setup to get started'
        elif last_login_info['pattern'] == 'active':
            insight_message = 'Great engagement! Keep it up'
        elif last_login_info['pattern'] == 'regular':
            insight_message = 'Good activity pattern'
        else:
            insight_message = 'Consider logging in more frequently'
        
        # Get recent activity metrics
        recent_sessions = UserSession.objects.filter(
            user=user,
            created_at__gte=timezone.now() - timedelta(days=30),
            is_active=True
        ).count()
        
        recent_security_events = SecurityEvent.objects.filter(
            user=user,
            created_at__gte=timezone.now() - timedelta(days=30)
        ).count()
        
        return Response({
            'account_age': {
                'days': account_age_days,
                'formatted': account_age
            },
            'last_activity': last_login_info,
            'risk_assessment': {
                'level': risk_level,
                'label': risk_label,
                'color': risk_color,
                'factors': risk_factors
            },
            'insights': {
                'message': insight_message,
                'pattern': last_login_info['pattern'],
                'engagement_score': min(100, max(0, 100 - (last_login_info['days_since'] or 0) * 2))
            },
            'recent_metrics': {
                'sessions_count': recent_sessions,
                'security_events': recent_security_events,
                'period_days': 30
            },
            'last_updated': timezone.now().isoformat()
        })
    
    def _get_credit_recommendations(self, user, profile, factors):
        """Generate credit improvement recommendations"""
        recommendations = []
        
        if not factors['identity_verified']['verified']:
            recommendations.append({
                'type': 'verification',
                'priority': 'high',
                'title': 'Complete Identity Verification',
                'description': 'Verify your identity to significantly boost your credit index',
                'impact': '+25 points'
            })
        
        if not factors['security_level']['mfa_enabled']:
            recommendations.append({
                'type': 'security',
                'priority': 'high',
                'title': 'Enable Multi-Factor Authentication',
                'description': 'Add MFA to improve security and credit score',
                'impact': '+20 points'
            })
        
        if factors['profile_data']['score'] < 80:
            recommendations.append({
                'type': 'profile',
                'priority': 'medium',
                'title': 'Complete Profile Information',
                'description': 'Add professional and contact details for better assessment',
                'impact': f"+{80 - factors['profile_data']['score']} points"
            })
        
        if not factors['government_id']['provided']:
            recommendations.append({
                'type': 'documentation',
                'priority': 'medium',
                'title': 'Add Government ID',
                'description': 'Upload Ghana Card for identity verification',
                'impact': '+15 points'
            })
        
        return recommendations