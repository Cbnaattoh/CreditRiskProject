@echo off
echo Starting Enhanced Credit Risk ML Model Dashboard...
echo.
echo NEW FEATURES:
echo - Comprehensive Ghana Employment Analysis
echo - Detailed Confidence Score Breakdown with Progress Bars
echo - Income vs Sector Expectations Analysis
echo - Job Stability Scoring (18 Ghana Job Categories)
echo - Interactive Employment Score Simulation
echo - Economic Sector Analysis (Services/Industry/Agriculture)
echo.
echo EXISTING FEATURES:
echo - Interactive Credit Score Prediction (98.39%% accuracy)
echo - Model Performance Metrics and Health Monitoring
echo - Feature Importance Rankings and Analysis
echo - Batch Processing and Data Visualization
echo - Real-time Predictions with Confidence Explanations
echo.
echo Dashboard Pages:
echo 1. Model Overview
echo 2. Interactive Prediction (ENHANCED)
echo 3. Ghana Employment Analysis (NEW)
echo 4. Model Performance
echo 5. Feature Analysis  
echo 6. Data Visualization
echo 7. Batch Analysis
echo.
echo Dashboard will open in your browser at http://localhost:8502
echo Press Ctrl+C to stop the dashboard
echo.
cd /d "%~dp0"
streamlit run streamlit_visualization_app.py --server.port 8502
pause