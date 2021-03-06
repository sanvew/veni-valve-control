SERIAL_PORT=/dev/ttyACM0
FQBN=arduino:avr:uno
RPI_ADDR=rpi-veni000

.PHONY: compile
compile:
	arduino-cli compile --fqbn $(FQBN) relay-control

.PHONY: upload
upload:
	arduino-cli upload -p $(SERIAL_PORT) --fqbn $(FQBN) relay-control

.PHONY: ard-run
ard-run: compile upload

.PHONY: rsync
rsync:
	rsync --exclude node_modules \
	--exclude .eslintrc.json --exclude '.git*' \
	-r $(shell pwd) pi@$(RPI_ADDR):/home/pi
