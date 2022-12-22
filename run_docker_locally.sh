# does this run ARM or X86 ISA? 

docker build -t chrt-express-postgres-tradingdata .

docker run -it -p 3000:8080 chrt-express-postgres-tradingdata

