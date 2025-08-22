FROM continuumio/miniconda3:latest

RUN mkdir -p /backend
RUN mkdir -p /scripts
RUN mkdir -p /static-files
RUN mkdir -p /media-files
RUN mkdir -p /frontend

COPY ./backend/requirements.yml /backend/requirements.yml
COPY ./scripts /scripts
RUN chmod +x ./scripts

RUN /opt/conda/bin/conda env create -f /backend/requirements.yml
ENV PATH /opt/conda/envs/macromates/bin:$PATH
RUN echo  "source activate macromates" > ~/.bashrc

ENV PYTHONDONTWRITEBYTECODE=1
RUN apt-get update
RUN apt-get upgrade -y
RUN apt-get install curl -y
RUN curl https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs

WORKDIR /frontend
COPY ./frontend/package.json /frontend/package.json
COPY ./frontend/package-lock.json /frontend/package-lock.json
RUN npm i
COPY ./frontend /frontend
RUN npm run build

COPY ./backend /backend

WORKDIR /backend


