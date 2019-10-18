FROM node:lts-slim

ARG DEBIAN_FRONTEND=noninteractive

# Install packages
RUN	yum update  -y \
  && yum install -y gcc-c++ make curl libX11-devel libXcomposite libXcursor libXdamage \
  && yum clean all \
  && curl --silent --location https://dl.yarnpkg.com/rpm/yarn.repo | tee /etc/yum.repos.d/yarn.repo \
  && yum install -y yarn
