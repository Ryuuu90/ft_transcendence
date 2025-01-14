all : up

up :
	@docker compose up --build -d

down:
	@docker compose down -v
	@docker rmi game

stop : 
		@docker-compose stop

status : 
		@docker-compose ps

logs :
		@docker-compose logs