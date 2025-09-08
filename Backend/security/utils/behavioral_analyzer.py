import numpy as np
import json
import logging
from datetime import datetime, timedelta
from django.utils.timezone import now
try:
    from django.contrib.gis.geoip2 import GeoIP2
    from django.contrib.gis.geoip2.base import GeoIP2Exception
except ImportError:
    # Fallback if GeoIP2 is not available
    class GeoIP2:
        def __init__(self):
            pass
        
        def city(self, ip):
            return {'city': 'Unknown', 'country_name': 'Unknown'}
    
    class GeoIP2Exception(Exception):
        pass
from ..models import BehavioralBiometrics, SuspiciousActivity

logger = logging.getLogger(__name__)

class BehavioralAnalyzer:
    """
    Advanced behavioral analysis system that monitors user patterns and detects anomalies.
    """
    
    def __init__(self):
        self.geoip = self._init_geoip()
        self.baseline_thresholds = {
            'typing_speed_variance': 0.3,
            'mouse_movement_variance': 0.4,
            'login_time_variance': 2.0,  # hours
            'geolocation_distance': 500,  # km
            'device_fingerprint_similarity': 0.8
        }

    def _init_geoip(self):
        """Initialize GeoIP2 for location analysis."""
        try:
            return GeoIP2()
        except GeoIP2Exception as e:
            logger.warning(f"GeoIP2 initialization failed: {e}")
            return None

    def analyze_behavioral_pattern(self, user, behavioral_data):
        """
        Analyze behavioral patterns and return confidence score.
        
        Args:
            user: Django User instance
            behavioral_data: Dict containing behavioral metrics
            
        Returns:
            float: Confidence score (0.0 to 1.0)
        """
        try:
            confidence_scores = []
            
            # Get user's behavioral baseline
            baseline = self._get_user_baseline(user)
            
            # Analyze typing patterns
            if 'typing' in behavioral_data:
                typing_confidence = self._analyze_typing_pattern(
                    behavioral_data['typing'], baseline.get('typing', {})
                )
                confidence_scores.append(typing_confidence)
            
            # Analyze mouse movement patterns
            if 'mouse' in behavioral_data:
                mouse_confidence = self._analyze_mouse_pattern(
                    behavioral_data['mouse'], baseline.get('mouse', {})
                )
                confidence_scores.append(mouse_confidence)
            
            # Analyze device/session patterns
            if 'device' in behavioral_data:
                device_confidence = self._analyze_device_pattern(
                    behavioral_data['device'], baseline.get('device', {}), user
                )
                confidence_scores.append(device_confidence)
            
            # Calculate weighted average confidence
            if confidence_scores:
                overall_confidence = np.mean(confidence_scores)
            else:
                # No behavioral data available, return neutral confidence
                overall_confidence = 0.5
                
            # Log analysis results
            logger.info(
                f"Behavioral analysis for user {user.id}: "
                f"confidence={overall_confidence:.3f}, "
                f"scores={confidence_scores}"
            )
            
            return min(max(overall_confidence, 0.0), 1.0)
            
        except Exception as e:
            logger.error(f"Error in behavioral analysis: {e}")
            return 0.5  # Neutral confidence on error

    def _get_user_baseline(self, user):
        """Get user's behavioral baseline from historical data."""
        try:
            biometric = BehavioralBiometrics.objects.filter(user=user).first()
            if biometric:
                return {
                    'typing': biometric.typing_pattern,
                    'mouse': biometric.mouse_movement,
                    'device': biometric.device_interaction
                }
            return {}
        except Exception as e:
            logger.error(f"Error getting user baseline: {e}")
            return {}

    def _analyze_typing_pattern(self, current_typing, baseline_typing):
        """Analyze typing patterns for consistency."""
        try:
            if not baseline_typing or not current_typing:
                return 0.6  # Neutral score for new users
            
            confidence_factors = []
            
            # Analyze typing speed (WPM)
            if 'wpm' in current_typing and 'wpm' in baseline_typing:
                current_wpm = current_typing['wpm']
                baseline_wpm = np.mean(baseline_typing.get('wpm_history', [current_wpm]))
                
                wpm_variance = abs(current_wpm - baseline_wpm) / max(baseline_wpm, 1)
                wpm_confidence = max(0, 1 - (wpm_variance / self.baseline_thresholds['typing_speed_variance']))
                confidence_factors.append(wpm_confidence)
            
            # Analyze keystroke dynamics (dwell time, flight time)
            if 'keystroke_dynamics' in current_typing and 'keystroke_dynamics' in baseline_typing:
                current_dynamics = current_typing['keystroke_dynamics']
                baseline_dynamics = baseline_typing['keystroke_dynamics']
                
                # Compare dwell times
                if 'dwell_times' in current_dynamics and 'dwell_times' in baseline_dynamics:
                    dwell_similarity = self._calculate_pattern_similarity(
                        current_dynamics['dwell_times'],
                        baseline_dynamics['dwell_times']
                    )
                    confidence_factors.append(dwell_similarity)
            
            # Analyze typing rhythm and pauses
            if 'rhythm_pattern' in current_typing and 'rhythm_pattern' in baseline_typing:
                rhythm_similarity = self._calculate_pattern_similarity(
                    current_typing['rhythm_pattern'],
                    baseline_typing['rhythm_pattern']
                )
                confidence_factors.append(rhythm_similarity)
            
            return np.mean(confidence_factors) if confidence_factors else 0.6
            
        except Exception as e:
            logger.error(f"Error analyzing typing pattern: {e}")
            return 0.5

    def _analyze_mouse_pattern(self, current_mouse, baseline_mouse):
        """Analyze mouse movement patterns for consistency."""
        try:
            if not baseline_mouse or not current_mouse:
                return 0.6  # Neutral score for new users
            
            confidence_factors = []
            
            # Analyze mouse movement velocity
            if 'velocity' in current_mouse and 'velocity' in baseline_mouse:
                current_vel = np.mean(current_mouse['velocity'])
                baseline_vel = np.mean(baseline_mouse.get('velocity_history', [current_vel]))
                
                vel_variance = abs(current_vel - baseline_vel) / max(baseline_vel, 1)
                vel_confidence = max(0, 1 - (vel_variance / self.baseline_thresholds['mouse_movement_variance']))
                confidence_factors.append(vel_confidence)
            
            # Analyze click patterns
            if 'click_intervals' in current_mouse and 'click_intervals' in baseline_mouse:
                click_similarity = self._calculate_pattern_similarity(
                    current_mouse['click_intervals'],
                    baseline_mouse['click_intervals']
                )
                confidence_factors.append(click_similarity)
            
            # Analyze movement trajectories
            if 'movement_patterns' in current_mouse and 'movement_patterns' in baseline_mouse:
                trajectory_similarity = self._calculate_trajectory_similarity(
                    current_mouse['movement_patterns'],
                    baseline_mouse['movement_patterns']
                )
                confidence_factors.append(trajectory_similarity)
            
            return np.mean(confidence_factors) if confidence_factors else 0.6
            
        except Exception as e:
            logger.error(f"Error analyzing mouse pattern: {e}")
            return 0.5

    def _analyze_device_pattern(self, current_device, baseline_device, user):
        """Analyze device and session patterns."""
        try:
            confidence_factors = []
            
            # Analyze IP geolocation
            if 'ip_address' in current_device:
                geo_confidence = self._analyze_geolocation(
                    current_device['ip_address'], user
                )
                confidence_factors.append(geo_confidence)
            
            # Analyze user agent consistency
            if 'user_agent' in current_device and 'user_agent' in baseline_device:
                ua_similarity = self._calculate_user_agent_similarity(
                    current_device['user_agent'],
                    baseline_device.get('user_agent_history', [])
                )
                confidence_factors.append(ua_similarity)
            
            # Analyze login timing patterns
            if 'timestamp' in current_device:
                timing_confidence = self._analyze_login_timing(
                    current_device['timestamp'], user
                )
                confidence_factors.append(timing_confidence)
            
            return np.mean(confidence_factors) if confidence_factors else 0.7
            
        except Exception as e:
            logger.error(f"Error analyzing device pattern: {e}")
            return 0.5

    def _analyze_geolocation(self, ip_address, user):
        """Analyze IP geolocation for anomalies."""
        try:
            if not self.geoip or ip_address in ['127.0.0.1', 'localhost']:
                return 0.8  # Local/development environment
            
            # Get current location
            try:
                current_location = self.geoip.city(ip_address)
                current_coords = (current_location.location.latitude, current_location.location.longitude)
            except Exception:
                return 0.5  # Unknown location
            
            # Get user's recent locations
            recent_activities = SuspiciousActivity.objects.filter(
                user=user,
                detected_at__gte=now() - timedelta(days=30)
            ).values_list('details', flat=True)
            
            # Calculate distance from typical locations
            min_distance = float('inf')
            for activity_details in recent_activities:
                if isinstance(activity_details, dict) and 'geolocation' in activity_details:
                    try:
                        prev_location = self.geoip.city(activity_details.get('ip_address', ''))
                        prev_coords = (prev_location.location.latitude, prev_location.location.longitude)
                        
                        distance = self._haversine_distance(current_coords, prev_coords)
                        min_distance = min(min_distance, distance)
                    except Exception:
                        continue
            
            if min_distance == float('inf'):
                return 0.7  # No previous location data
            
            # Calculate confidence based on distance
            if min_distance <= self.baseline_thresholds['geolocation_distance']:
                return 0.9  # Within expected range
            else:
                # Decreasing confidence with distance
                confidence = max(0.1, 0.9 - (min_distance / 2000))  # 2000km = very suspicious
                return confidence
                
        except Exception as e:
            logger.error(f"Error analyzing geolocation: {e}")
            return 0.7

    def _analyze_login_timing(self, current_timestamp, user):
        """Analyze login timing patterns."""
        try:
            current_time = datetime.fromisoformat(current_timestamp.replace('Z', '+00:00'))
            current_hour = current_time.hour
            
            # Get user's historical login times
            recent_activities = SuspiciousActivity.objects.filter(
                user=user,
                activity_type='LOGIN',
                detected_at__gte=now() - timedelta(days=30)
            )
            
            if not recent_activities.exists():
                return 0.7  # No historical data
            
            # Calculate typical login hours
            login_hours = []
            for activity in recent_activities:
                login_hours.append(activity.detected_at.hour)
            
            if not login_hours:
                return 0.7
            
            # Check if current hour is within user's typical range
            hour_mean = np.mean(login_hours)
            hour_std = np.std(login_hours)
            
            # Z-score for current hour
            z_score = abs(current_hour - hour_mean) / max(hour_std, 1)
            
            # Convert z-score to confidence (higher z-score = lower confidence)
            confidence = max(0.1, 1 - (z_score / 3))  # 3 standard deviations
            
            return confidence
            
        except Exception as e:
            logger.error(f"Error analyzing login timing: {e}")
            return 0.7

    def _calculate_pattern_similarity(self, pattern1, pattern2):
        """Calculate similarity between two numerical patterns."""
        try:
            if not pattern1 or not pattern2:
                return 0.5
            
            # Convert to numpy arrays
            arr1 = np.array(pattern1[:min(len(pattern1), 100)])  # Limit comparison
            arr2 = np.array(pattern2[:min(len(pattern2), 100)])
            
            # Pad shorter array
            max_len = max(len(arr1), len(arr2))
            if len(arr1) < max_len:
                arr1 = np.pad(arr1, (0, max_len - len(arr1)), mode='mean')
            if len(arr2) < max_len:
                arr2 = np.pad(arr2, (0, max_len - len(arr2)), mode='mean')
            
            # Calculate correlation coefficient
            correlation = np.corrcoef(arr1, arr2)[0, 1]
            
            # Handle NaN correlation
            if np.isnan(correlation):
                return 0.5
            
            # Convert correlation to confidence (higher correlation = higher confidence)
            confidence = (correlation + 1) / 2  # Scale from [-1,1] to [0,1]
            
            return confidence
            
        except Exception as e:
            logger.error(f"Error calculating pattern similarity: {e}")
            return 0.5

    def _calculate_trajectory_similarity(self, traj1, traj2):
        """Calculate similarity between mouse movement trajectories."""
        try:
            # Simplified trajectory comparison
            # In practice, you would use more sophisticated algorithms like DTW
            if not traj1 or not traj2:
                return 0.5
            
            # Extract key metrics from trajectories
            metrics1 = self._extract_trajectory_metrics(traj1)
            metrics2 = self._extract_trajectory_metrics(traj2)
            
            # Compare metrics
            similarity_scores = []
            for key in metrics1:
                if key in metrics2:
                    diff = abs(metrics1[key] - metrics2[key])
                    max_val = max(metrics1[key], metrics2[key], 1)
                    similarity = 1 - (diff / max_val)
                    similarity_scores.append(similarity)
            
            return np.mean(similarity_scores) if similarity_scores else 0.5
            
        except Exception as e:
            logger.error(f"Error calculating trajectory similarity: {e}")
            return 0.5

    def _extract_trajectory_metrics(self, trajectory):
        """Extract metrics from mouse movement trajectory."""
        try:
            metrics = {
                'total_distance': 0,
                'avg_velocity': 0,
                'direction_changes': 0,
                'pause_count': 0
            }
            
            if not trajectory or len(trajectory) < 2:
                return metrics
            
            distances = []
            velocities = []
            directions = []
            
            for i in range(1, len(trajectory)):
                prev_point = trajectory[i-1]
                curr_point = trajectory[i]
                
                # Calculate distance
                dx = curr_point.get('x', 0) - prev_point.get('x', 0)
                dy = curr_point.get('y', 0) - prev_point.get('y', 0)
                distance = np.sqrt(dx**2 + dy**2)
                distances.append(distance)
                
                # Calculate velocity
                time_diff = curr_point.get('timestamp', 0) - prev_point.get('timestamp', 0)
                if time_diff > 0:
                    velocity = distance / time_diff
                    velocities.append(velocity)
                
                # Calculate direction
                if distance > 0:
                    direction = np.arctan2(dy, dx)
                    directions.append(direction)
            
            metrics['total_distance'] = sum(distances)
            metrics['avg_velocity'] = np.mean(velocities) if velocities else 0
            metrics['direction_changes'] = len([i for i in range(1, len(directions)) 
                                              if abs(directions[i] - directions[i-1]) > np.pi/4])
            metrics['pause_count'] = len([v for v in velocities if v < 0.1])
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error extracting trajectory metrics: {e}")
            return {'total_distance': 0, 'avg_velocity': 0, 'direction_changes': 0, 'pause_count': 0}

    def _calculate_user_agent_similarity(self, current_ua, historical_uas):
        """Calculate user agent similarity."""
        try:
            if not historical_uas:
                return 0.7  # New user agent
            
            # Check for exact matches
            if current_ua in historical_uas:
                return 0.95  # High confidence for exact match
            
            # Calculate similarity based on key components
            current_components = self._parse_user_agent(current_ua)
            
            max_similarity = 0
            for historical_ua in historical_uas[-10:]:  # Check last 10 UAs
                historical_components = self._parse_user_agent(historical_ua)
                similarity = self._compare_ua_components(current_components, historical_components)
                max_similarity = max(max_similarity, similarity)
            
            return max_similarity
            
        except Exception as e:
            logger.error(f"Error calculating UA similarity: {e}")
            return 0.5

    def _parse_user_agent(self, user_agent):
        """Parse user agent string into components."""
        try:
            components = {
                'browser': '',
                'browser_version': '',
                'os': '',
                'os_version': '',
                'device': ''
            }
            
            # Simple parsing (in practice, use a library like user-agents)
            ua_lower = user_agent.lower()
            
            # Browser detection
            if 'chrome' in ua_lower:
                components['browser'] = 'chrome'
            elif 'firefox' in ua_lower:
                components['browser'] = 'firefox'
            elif 'safari' in ua_lower:
                components['browser'] = 'safari'
            elif 'edge' in ua_lower:
                components['browser'] = 'edge'
            
            # OS detection
            if 'windows' in ua_lower:
                components['os'] = 'windows'
            elif 'mac' in ua_lower:
                components['os'] = 'mac'
            elif 'linux' in ua_lower:
                components['os'] = 'linux'
            elif 'android' in ua_lower:
                components['os'] = 'android'
            elif 'ios' in ua_lower:
                components['os'] = 'ios'
            
            return components
            
        except Exception as e:
            logger.error(f"Error parsing user agent: {e}")
            return {}

    def _compare_ua_components(self, comp1, comp2):
        """Compare user agent components."""
        try:
            scores = []
            
            # Browser similarity (most important)
            if comp1.get('browser') == comp2.get('browser'):
                scores.append(1.0)
            else:
                scores.append(0.0)
            
            # OS similarity (important)
            if comp1.get('os') == comp2.get('os'):
                scores.append(1.0)
            else:
                scores.append(0.0)
            
            # Weight browser and OS more heavily
            weighted_score = (scores[0] * 0.6) + (scores[1] * 0.4)
            
            return weighted_score
            
        except Exception as e:
            logger.error(f"Error comparing UA components: {e}")
            return 0.5

    def _haversine_distance(self, coord1, coord2):
        """Calculate the great circle distance between two points on Earth."""
        try:
            lat1, lon1 = coord1
            lat2, lon2 = coord2
            
            # Convert to radians
            lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
            
            # Haversine formula
            dlat = lat2 - lat1
            dlon = lon2 - lon1
            a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
            c = 2 * np.arcsin(np.sqrt(a))
            
            # Earth radius in kilometers
            R = 6371
            distance = R * c
            
            return distance
            
        except Exception as e:
            logger.error(f"Error calculating haversine distance: {e}")
            return 0