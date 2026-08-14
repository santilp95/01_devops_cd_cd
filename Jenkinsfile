pipeline {
    agent any

    environment {
        REGISTRY        = "ghcr.io"
        IMAGE_NAMESPACE = "santilp95"
        IMAGE_NAME      = "devops-lab-app"
        IMAGE_TAG       = "${env.BUILD_NUMBER}"
        FULL_IMAGE      = "${REGISTRY}/${IMAGE_NAMESPACE}/${IMAGE_NAME}:${IMAGE_TAG}"
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {
        stage('Clonar repositorio') {
            steps {
                checkout scm
            }
        }

        stage('Construir imagen Docker') {
            steps {
                sh "docker build -t ${FULL_IMAGE} ."
            }
        }

        stage('Escaneo básico de la imagen') {
            steps {
                sh "docker image inspect ${FULL_IMAGE} > /dev/null"
                echo "Imagen construida correctamente: ${FULL_IMAGE}"
            }
        }

        stage('Publicar imagen en el registro (GHCR)') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'ghcr-credentials',
                    usernameVariable: 'REGISTRY_USER',
                    passwordVariable: 'REGISTRY_TOKEN'
                )]) {
                    sh """
                        echo "\$REGISTRY_TOKEN" | docker login ${REGISTRY} -u "\$REGISTRY_USER" --password-stdin
                        docker push ${FULL_IMAGE}
                        docker tag ${FULL_IMAGE} ${REGISTRY}/${IMAGE_NAMESPACE}/${IMAGE_NAME}:latest
                        docker push ${REGISTRY}/${IMAGE_NAMESPACE}/${IMAGE_NAME}:latest
                    """
                }
            }
        }
    }

    post {
        always {
            sh 'docker logout ${REGISTRY} || true'
        }
        success {
            echo "Pipeline CD completado: ${FULL_IMAGE} publicado en ${REGISTRY}."
        }
        failure {
            echo "El pipeline CD falló. Revisa el log de la etapa correspondiente."
        }
    }
}
