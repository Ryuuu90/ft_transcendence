all : up

up :
	@docker compose up --build 

down:
	@docker compose down -v
	@docker rmi front

re: down up

stop : 
		@docker-compose stop

status : 
		@docker-compose ps

logs :
		@docker-compose logs