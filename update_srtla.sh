#!/bin/sh
#USERNAME=`getent passwd 1000 | cut -d: -f1`
USERNAME=`id -un 1000`
cp -R ../srtla ../srtla_lastversion && cd .. && rm -rf ./srtla && git clone https://github.com/BELABOX/srtla && cd srtla && make && chown -R $USERNAME .