pipeline {
    agent any

    parameters {
        booleanParam(name: 'RUN_E2E', defaultValue: true, description: 'Ejecutar tests E2E (desactivar para builds rápidos)')
    }

    tools {
        nodejs 'NodeJS-20'
    }

    environment {
        BACKEND_DIR = "${WORKSPACE}\\backend"
        FRONTEND_DIR = "${WORKSPACE}\\frontend"
        E2E_DIR = "${WORKSPACE}\\e2e"
        DB_TYPE = "sqlite"
        SECRET_KEY = "jenkins-test-key-not-for-production"
        PLAYWRIGHT_BROWSERS_PATH = "${JENKINS_HOME}\\ms-playwright"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Backend Tests') {
            steps {
                dir('backend') {
                    bat 'if not exist venv ("C:\\Users\\Usuario\\AppData\\Local\\Programs\\Python\\Python311\\python.exe" -m venv venv)'
                    bat 'call venv\\Scripts\\activate.bat && pip install -r requirements.txt'
                    bat 'call venv\\Scripts\\activate.bat && pytest tests/ -v --cov --cov-report=html:cov_html --cov-report=xml --junitxml=report.xml --html=report.html --self-contained-html'
                }
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: 'backend/report.xml'
                }
                success {
                    publishHTML(target: [
                        allowMissing: true,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'backend/cov_html',
                        reportFiles: 'index.html',
                        reportName: 'Backend Coverage'
                    ])
                    publishHTML(target: [
                        allowMissing: true,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'backend',
                        reportFiles: 'report.html',
                        reportName: 'Backend Test Report'
                    ])
                }
            }
        }

        stage('Frontend Tests') {
            steps {
                dir('frontend') {
                    bat 'npm ci'
                    catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
                        bat 'npx vitest run --reporter=junit --outputFile=report.xml'
                    }
                }
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: 'frontend/report.xml'
                }
            }
        }

        stage('Lint') {
            steps {
                dir('frontend') {
                    bat 'npm run lint'
                }
            }
        }

        stage('Build') {
            steps {
                dir('frontend') {
                    bat 'npm run build'
                }
            }
            post {
                success {
                    archiveArtifacts artifacts: 'frontend/dist/**/*', fingerprint: true
                }
            }
        }

        stage('E2E Tests') {
            when { expression { params.RUN_E2E } }
            steps {
                dir('e2e') {
                    bat 'npm ci'
                    bat 'npx playwright install --with-deps msedge'
                    bat 'npx playwright test'
                }
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: 'e2e/test-results/**/*.xml'
                }
                success {
                    publishHTML(target: [
                        allowMissing: true,
                        alwaysLinkToLastBuild: true,
                        keepAll: true,
                        reportDir: 'e2e/playwright-report',
                        reportFiles: 'index.html',
                        reportName: 'E2E Test Report'
                    ])
                }
            }
        }
    }

    post {
        failure {
            echo 'Pipeline falló. Revisa los reportes para más detalles.'
        }
        success {
            echo 'Pipeline completado exitosamente.'
        }
        cleanup {
            dir('frontend') { bat 'if exist dist rmdir /s /q dist' }
            dir('frontend') { bat 'if exist report.xml del /f /q report.xml' }
            dir('e2e') { bat 'if exist test-results rmdir /s /q test-results' }
            dir('e2e') { bat 'if exist playwright-report rmdir /s /q playwright-report' }
            dir('backend') { bat 'if exist cov_html rmdir /s /q cov_html' }
            dir('backend') { bat 'if exist *.xml del /f /q *.xml' }
            dir('backend') { bat 'if exist *.html del /f /q *.html' }
        }
    }
}
