# Install dependencies
install:
	npm install

# Run the program using ts-node (no build needed)
run: install
	npm start http://test.brightsign.io:3000

# Clean node_modules if needed
clean:
	rm -rf node_modules

# Default action
all: run
