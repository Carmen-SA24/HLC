-- seed.sql: crea tablas reales y pobla con los ejemplos del proyecto
-- Tabla: pokemon
CREATE TABLE IF NOT EXISTS public.pokemon (
  id integer PRIMARY KEY,
  nombre text NOT NULL,
  tipo text,
  hp integer,
  ataque integer,
  defensa integer,
  sp_atk integer,
  sp_def integer,
  velocidad integer
);

-- Tabla: peliculas
CREATE TABLE IF NOT EXISTS public.peliculas (
  id integer PRIMARY KEY,
  title text NOT NULL,
  director text,
  year integer,
  length_minutes integer
);

-- Inserts para pokemon (ejemplos)
INSERT INTO public.pokemon (id,nombre,tipo,hp,ataque,defensa,sp_atk,sp_def,velocidad) VALUES
(1,'Bulbasaur','Planta/Veneno',45,49,49,65,65,45),
(2,'Charmander','Fuego',39,52,43,60,50,65),
(3,'Squirtle','Agua',44,48,65,50,64,43),
(4,'Pikachu','Eléctrico',35,55,40,50,50,90),
(5,'Butterfree','Bicho/Volador',60,45,50,90,80,70),
(6,'Ivysaur','Planta/Veneno',60,62,63,80,80,60),
(7,'Venusaur','Planta/Veneno',80,82,83,100,100,80),
(8,'Charmeleon','Fuego',58,64,58,80,65,80),
(9,'Charizard','Fuego/Volador',78,84,78,109,85,100),
(10,'Wartortle','Agua',59,63,80,65,80,58),
(11,'Blastoise','Agua',79,83,100,85,105,78),
(12,'Caterpie','Bicho',45,30,35,20,20,45),
(13,'Metapod','Bicho',50,20,55,25,25,30),
(14,'Weedle','Bicho/Veneno',40,35,30,20,20,50),
(15,'Kakuna','Bicho/Veneno',45,25,50,25,25,35)
ON CONFLICT (id) DO NOTHING;

-- Inserts para peliculas (ejemplos)
INSERT INTO public.peliculas (id,title,director,year,length_minutes) VALUES
(1,'La La Land','Steve McQueen',2010,81),
(2,'Zootopia','Steve McQueen',2014,95),
(3,'Deadpool','Steve McQueen',2016,93),
(4,'Monsters, Inc.','Pete Docter',2015,92),
(5,'Finding Nemo','Andrew Stanton',2013,107),
(6,'The Nice Guys','Richard Linklater',1996,116),
(7,'Bee Movie','Steve McQueen',2016,117),
(8,'Begin Again','Richard Linklater',2017,115),
(9,'WALL-E','Andrew Stanton',1999,104),
(10,'Up','Joel Coen',2009,101),
(11,'Boss Baby','Lee Unkrich',2010,120),
(12,'X-Men Apocalypse','Steve McQueen',1998,120),
(13,'Moana','Brenda Chapman',2012,103),
(14,'Frozen','Dan Scanlon',2013,110)
ON CONFLICT (id) DO NOTHING;
