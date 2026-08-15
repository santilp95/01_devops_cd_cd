pipeline {
    agent any

    environment {
        PROJECT_ID   = "TU_PROJECT_ID"
        REGION       = "us-central1"
        REPOSITORY   = "mi-app"
        SERVICE_NAME = "mi-app"
        IMAGE_NAME   = "mi-app"
        IMAGE_TAG    = "${env.BUILD_NUMBER}"
        IMAGE        = "${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}"
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    triggers {
        pollSCM('H/5 * * * *')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build') {
            steps {
                sh "docker build -t ${IMAGE}:${IMAGE_TAG} -t ${IMAGE}:latest ."
            }
        }

        stage('Deploy') {
            steps {
                withCredentials([file(credentialsId: 'gcp-service-account-key', variable: 'GCP_KEY_FILE')]) {
                    sh """
                        gcloud auth activate-service-account --key-file="\$GCP_KEY_FILE"
                        gcloud config set project ${PROJECT_ID}
                        gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet

                        docker push ${IMAGE}:${IMAGE_TAG}
                        docker push ${IMAGE}:latest

                        gcloud run deploy ${SERVICE_NAME} \
                            --image=${IMAGE}:${IMAGE_TAG} \
                            --region=${REGION} \
                            --platform=managed \
                            --quiet
                    """
                }
            }
        }
    }

    post {
        always {
            sh 'gcloud auth revoke --all --quiet || true'
        }
        success {
            echo "Deploy completado: ${IMAGE}:${IMAGE_TAG} publicado y desplegado en Cloud Run (${SERVICE_NAME})."
        }
        failure {
            echo "El pipeline falló. Revisa el log de la etapa correspondiente."
        }
    }
}
