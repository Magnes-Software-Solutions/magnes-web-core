CREATE DATABASE magnes;
USE magnes;

CREATE TABLE fabricante(
idFabricante INT PRIMARY KEY AUTO_INCREMENT,
razaoSocial VARCHAR(100) NOT NULL,
cnpj CHAR(14) NOT NULL UNIQUE
);

CREATE TABLE estabelecimento(
idEstabelecimento INT PRIMARY KEY AUTO_INCREMENT,
razaoSocialEstabelecimento VARCHAR(100) NOT NULL,
tipoEstabelecimento VARCHAR(45) NOT NULL,
cep VARCHAR(10) NOT NULL,
numeroEstabelecimento CHAR(5) NOT NULL
);

CREATE TABLE componente(
idComponente INT PRIMARY KEY AUTO_INCREMENT,
nomeComponente VARCHAR(50) NOT NULL,
tipoComponente VARCHAR(45) NOT NULL,
unidadeMedida VARCHAR(45) NOT NULL,
capacidadeMaxima FLOAT NOT NULL
);

CREATE TABLE maquina(
idMaquina INT PRIMARY KEY AUTO_INCREMENT,
numeroSerie VARCHAR(45) NOT NULL UNIQUE,
tipoModelo VARCHAR(45) NOT NULL,
statusAtividade VARCHAR(10),
fkEstabelecimento INT NOT NULL,
FOREIGN KEY (fkEstabelecimento) 
    REFERENCES estabelecimento(idEstabelecimento),
fkFabricante INT NOT NULL,
FOREIGN KEY (fkFabricante) 
    REFERENCES fabricante(idFabricante)
);

CREATE TABLE componente_maquina(
PRIMARY KEY (fkComponente, fkMaquina),
fkComponente INT NOT NULL,
FOREIGN KEY (fkComponente) 
    REFERENCES componente(idComponente),
fkMaquina INT NOT NULL,
FOREIGN KEY (fkMaquina) 
    REFERENCES maquina(idMaquina),
limite FLOAT NOT NULL
);

CREATE TABLE registro(
idRegistro INT PRIMARY KEY AUTO_INCREMENT,
fkComponente INT NOT NULL,
FOREIGN KEY (fkComponente) 
    REFERENCES componente(idComponente),
fkMaquina INT NOT NULL,
FOREIGN KEY (fkMaquina) 
    REFERENCES maquina(idMaquina),
dataHora DATETIME NOT NULL
);

CREATE TABLE usuario(
idUsuario INT PRIMARY KEY AUTO_INCREMENT,
nome VARCHAR(100) NOT NULL,
email VARCHAR(100) NOT NULL UNIQUE,
senha VARCHAR(255) NOT NULL,
cpf CHAR(11) NOT NULL UNIQUE,
telefone VARCHAR(20) UNIQUE,
fkFabricante INT,
FOREIGN KEY (fkFabricante) 
    REFERENCES fabricante(idFabricante),
fkSupervisor INT,
FOREIGN KEY (fkSupervisor) 
    REFERENCES usuario(idUsuario)
);