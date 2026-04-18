CREATE DATABASE magnes;
USE magnes;

CREATE TABLE redeHospital(
idRedeHospital INT PRIMARY KEY AUTO_INCREMENT,
razaoSocial VARCHAR(100) NOT NULL,
cnpj CHAR(14) NOT NULL UNIQUE
);

CREATE TABLE enderecoHospital(
idEnderecoHospital INT PRIMARY KEY AUTO_INCREMENT,
bairro VARCHAR(100) NOT NULL,
cidade VARCHAR(100) NOT NULL,
numeroEstabelecimento CHAR(5) NOT NULL,
cep VARCHAR(10) NOT NULL
);

CREATE TABLE componente(
idComponente INT PRIMARY KEY AUTO_INCREMENT,
nomeComponente VARCHAR(50) NOT NULL,
tipoComponente VARCHAR(45) NOT NULL,
unidadeMedida VARCHAR(45) NOT NULL,
capacidadeMaxima FLOAT NOT NULL
);

CREATE TABLE maquina(
macAddress VARCHAR(12) PRIMARY KEY,
numeroSerie VARCHAR(45) NOT NULL UNIQUE,
tipoModelo VARCHAR(45) NOT NULL,
statusAtividade VARCHAR(10),
fkEnderecoHospital INT NOT NULL,
FOREIGN KEY (fkEnderecoHospital) 
    REFERENCES enderecoHospital(idEnderecoHospital),
fkRedeHospital INT NOT NULL,
FOREIGN KEY (fkRedeHospital) 
    REFERENCES redeHospital(idRedeHospital)
);

CREATE TABLE componente_maquina(
PRIMARY KEY (fkComponente, fkMaquina),
fkComponente INT NOT NULL,
FOREIGN KEY (fkComponente) 
    REFERENCES componente(idComponente),
fkMaquina VARCHAR(12) NOT NULL,
FOREIGN KEY (fkMaquina) 
    REFERENCES maquina(macAddress),
limite FLOAT NOT NULL
);

CREATE TABLE registro(
idRegistro INT PRIMARY KEY AUTO_INCREMENT,
fkComponente INT NOT NULL,
FOREIGN KEY (fkComponente) 
    REFERENCES componente(idComponente),
fkMaquina VARCHAR(12) NOT NULL,
FOREIGN KEY (fkMaquina) 
    REFERENCES maquina(macAddress),
dataHora DATETIME NOT NULL
);

CREATE TABLE usuario(
idUsuario INT PRIMARY KEY AUTO_INCREMENT,
nome VARCHAR(100) NOT NULL,
email VARCHAR(100) NOT NULL UNIQUE,
senha VARCHAR(255) NOT NULL,
cpf CHAR(11) NOT NULL UNIQUE,
telefone VARCHAR(20) UNIQUE,
fkRedeHospital INT,
FOREIGN KEY (fkRedeHospital) 
    REFERENCES redeHospital(idRedeHospital),
fkSupervisor INT,
FOREIGN KEY (fkSupervisor) 
    REFERENCES usuario(idUsuario)
);