FROM centos:centos7
MAINTAINER akira kuriyama
EXPOSE 8000

RUN yum update -y

ADD . /usr/local/src/todo
ADD build/nginx.conf /etc/nginx/

RUN rpm -i http://nginx.org/packages/centos/7/noarch/RPMS/nginx-release-centos-7-0.el7.ngx.noarch.rpm
RUN yum install -y nginx git hg golang
ENV GOPATH /root/go
ENV PATH $PATH:$GOPATH/bin
WORKDIR /usr/local/src/todo/src
RUN echo $GOPATH
RUN echo $PATH
RUN go get; exit 0;

ENTRYPOINT /usr/local/src/todo/build/run.sh


