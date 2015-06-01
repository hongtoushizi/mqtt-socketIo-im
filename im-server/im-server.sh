#!/bin/bash

scriptPath=$(cd `dirname $0`; pwd)
nohup "$scriptPath"/_im-server-loop-start.sh &



