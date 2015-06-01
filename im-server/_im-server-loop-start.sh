#!/bin/bash
#node server

scriptPath=$(cd `dirname $0`; pwd)

while [ true ]
do
	cd "$scriptPath"
	DATE=$(date '+%m%d%y')
	date_createMqttServer_log="$scriptPath"/node_createMqttServer_output_$DATE.log   #    log 

	date_mqttSocketIoPhp_log="$scriptPath"/node_mqttSocketIoPhp_output_$DATE.log   #    log 
	node ./lib/createMqttServer.js  > $date_createMqttServer_log  2>&1

	node ./lib/mqttSocketIoPhp.js  > $date_mqttSocketIoPhp_log  2>&1
done



