FROM mcr.microsoft.com/devcontainers/universal:2
RUN wget https://go.dev/dl/go1.22.1.linux-amd64.tar.gz
RUN rm -rf /usr/local/go && tar -C /usr/local -xzf go1.22.1.linux-amd64.tar.gz
RUN export PATH=$PATH:/usr/local/go/bin
RUN rm -rf ./go1.22.1.linux-amd64.tar.gz
RUN go install golang.org/x/tools/cmd/deadcode@latest