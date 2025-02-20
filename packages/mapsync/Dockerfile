# version 1.2.0
# docker pull doctorray/minecraft-ecsfargate-watchdog

FROM amazon/aws-cli

COPY ./mapsync.sh .

ENTRYPOINT ["./mapsync.sh"]
