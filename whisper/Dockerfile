FROM nvidia/cuda:12.6.2-cudnn-runtime-ubuntu22.04

WORKDIR /app

RUN apt-get update && apt-get install -y python3-pip

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

CMD ["python3", "main.py"]