CREATE DATABASE IF NOT EXISTS magnes_db;

USE magnes_db;

CREATE TABLE fabricante (
    idFabricante INT PRIMARY KEY AUTO_INCREMENT,
    nomeFabricante VARCHAR(100) NOT NULL,
    cnpj VARCHAR(14) NOT NULL UNIQUE,
    token CHAR(10) NOT NULL UNIQUE,
    dt_cadastro DATE NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    tel_celular VARCHAR(15),
    tel_corporativo VARCHAR(10)
);

CREATE TABLE funcionario (
    idFuncionario INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    cargo VARCHAR(45),
    dt_cadastro DATETIME,
    fkFabricante INT NOT NULL,
    fk_supervisor INT,
    FOREIGN KEY (fkFabricante) REFERENCES fabricante(idFabricante),
    FOREIGN KEY (fk_supervisor) REFERENCES funcionario(idFuncionario)
);

CREATE TABLE localizacao (
    idLocalizacao INT PRIMARY KEY AUTO_INCREMENT,
    nome_instituicao VARCHAR(45) NOT NULL,
    cep VARCHAR(10) NOT NULL,
    numero INT NOT NULL,
    email VARCHAR(100),
    tipo_estabelecimento VARCHAR(45)
);

CREATE TABLE maquina (
    idMaquina INT PRIMARY KEY AUTO_INCREMENT,
    numero_serie VARCHAR(45) NOT NULL UNIQUE,
    modelo VARCHAR(45) NOT NULL,
    dt_instalacao DATE,
    fkFabricante INT NOT NULL,
    fkLocalizacao INT NOT NULL,
    status_ativo TINYINT DEFAULT 1,
    FOREIGN KEY (fkFabricante) REFERENCES fabricante(idFabricante),
    FOREIGN KEY (fkLocalizacao) REFERENCES localizacao(idLocalizacao)
);

CREATE TABLE contato_inicial (
    idContato_inicial INT PRIMARY KEY AUTO_INCREMENT,
    email_remetente VARCHAR(45),
    nome VARCHAR(45),
    mensagem VARCHAR(200)
);

CREATE TABLE historico_manutencao (
    idManutencao INT,
    inicio_manutencao DATETIME NOT NULL,
    termino_manutencao DATETIME,
    motivo VARCHAR(20) NOT NULL,
    descricao VARCHAR(200),
    fkMaquina INT NOT NULL,
    PRIMARY KEY (fkMaquina, idManutencao),
    FOREIGN KEY (fkMaquina) REFERENCES maquina(idMaquina)
);

CREATE TABLE responsavel (
    fkMaquina INT NOT NULL,
    fkFuncionario INT NOT NULL,
    ultimo_acesso DATETIME,
    turno VARCHAR(20),
    PRIMARY KEY (fkMaquina, fkFuncionario),
    FOREIGN KEY (fkMaquina) REFERENCES maquina(idMaquina),
    FOREIGN KEY (fkFuncionario) REFERENCES funcionario(idFuncionario)
);

CREATE TABLE componente (
    idComponente INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(45) NOT NULL,
    tipo VARCHAR(45),
    uni_med VARCHAR(15) NOT NULL
);

CREATE TABLE maquina_tem_componente (
    fkMaquina INT NOT NULL,
    fkComponente INT NOT NULL,
    limite INT,
    PRIMARY KEY (fkMaquina, fkComponente),
    FOREIGN KEY (fkMaquina) REFERENCES maquina(idMaquina),
    FOREIGN KEY (fkComponente) REFERENCES componente(idComponente)
);

DELIMITER $$ 
CREATE TRIGGER tg_maquina_componente
AFTER INSERT ON maquina
FOR EACH ROW
BEGIN
    INSERT INTO maquina_tem_componente (fkMaquina, fkComponente, limite)
    VALUES (NEW.idMaquina, 1, 512);
    INSERT INTO maquina_tem_componente (fkMaquina, fkComponente, limite)
    VALUES (NEW.idMaquina, 2, 32);
    INSERT INTO maquina_tem_componente (fkMaquina, fkComponente, limite)
    VALUES (NEW.idMaquina, 3, 1000);
END $$
DELIMITER ; 
