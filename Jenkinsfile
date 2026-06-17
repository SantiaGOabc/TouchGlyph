pipeline {
    agent any

    tools {
        nodejs 'NodeJS-20'
    }

    environment {
        BACKEND_DIR = "${WORKSPACE}\\backend"
        FRONTEND_DIR = "${WORKSPACE}\\frontend"
        E2E_DIR = "${WORKSPACE}\\e2e"
        DB_TYPE = "sqlite"
        SECRET_KEY = "jenkins-test-key-not-for-production"
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
                    bat 'if exist venv rmdir /s /q venv'
                    bat '"C:\\Users\\Usuario\\AppData\\Local\\Programs\\Python\\Python311\\python.exe" -m venv venv'
                    bat 'call venv\\Scripts\\activate.bat && pip install -r requirements.txt'
                    bat 'call venv\\Scripts\\activate.bat && pytest tests/ -v --cov --cov-report=html --cov-report=xml --junitxml=report.xml --html=report.html --self-contained-html'
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
                    bat 'npx vitest run --reporter=junit --outputFile=report.xml'
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
            cleanWs()
        }
    }
}
