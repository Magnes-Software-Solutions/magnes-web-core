CREATE DATABASE magnes_db;
USE magnes_db;

CREATE TABLE contato_inicial (
    idContato INT PRIMARY KEY AUTO_INCREMENT,
    email_remetente VARCHAR(45),
    nome VARCHAR(45),
    mensagem VARCHAR(255)
);

CREATE TABLE fabricante (
    idFabricante INT PRIMARY KEY AUTO_INCREMENT,
    nomeFabricante VARCHAR(100),
    cnpj VARCHAR(14),
    token CHAR(10),
    dt_cadastro DATE,
    email VARCHAR(100),
    tel_celular VARCHAR(15),
    tel_corporativo VARCHAR(10)
);

CREATE TABLE funcionario (
    idFuncionario INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100),
    email VARCHAR(100),
    senha VARCHAR(255),
    cargo VARCHAR(45),
    dt_cadastro DATETIME,
    fkFabricante INT,
    fkSupervisor INT,
    FOREIGN KEY (fkFabricante) REFERENCES fabricante(idFabricante),
    FOREIGN KEY (fkSupervisor) REFERENCES funcionario(idFuncionario)
);

CREATE TABLE localizacao (
    idLocalizacao INT PRIMARY KEY AUTO_INCREMENT,
    nome_instituicao VARCHAR(45),
    cep VARCHAR(10),
    numero INT,
    email VARCHAR(100),
    tipo_estabelecimento VARCHAR(45)
);

CREATE TABLE rm (
    idRm INT PRIMARY KEY AUTO_INCREMENT,
    numero_serie VARCHAR(45),
    modelo VARCHAR(45),
    dt_instalacao DATE,
    qtd_armazenamento INT,
    qtd_memoria INT,
    modelo_cpu VARCHAR(45),
    fkFabricante INT,
    fkLocalizacao INT,
    status_ativo VARCHAR(45),
    FOREIGN KEY (fkFabricante) REFERENCES fabricante(idFabricante),
    FOREIGN KEY (fkLocalizacao) REFERENCES localizacao(idLocalizacao)
);

CREATE TABLE registros (
    idRegistros INT PRIMARY KEY AUTO_INCREMENT,
    qtd_armazenamento_utilizado INT,
    qtd_memoria_utilizado INT,
    percentual_uso_cpu INT,
    data_registro DATETIME,
    fkRm INT,
    FOREIGN KEY (fkRm) REFERENCES rm(idRm)
);

CREATE TABLE historico_manutencao (
    idManutencao INT PRIMARY KEY AUTO_INCREMENT,
    dt_manutencao DATE,
    motivo VARCHAR(45),
    descricao VARCHAR(255),
    fkRm INT,
    FOREIGN KEY (fkRm) REFERENCES rm(idRm)
);

CREATE TABLE responsavel (
    fkRm INT,
    fkFuncionario INT,
    ultimo_acesso DATETIME,
    funcao VARCHAR(45),
    PRIMARY KEY (fkRm, fkFuncionario),
    FOREIGN KEY (fkRm) REFERENCES rm(idRm),
    FOREIGN KEY (fkFuncionario) REFERENCES funcionario(idFuncionario)
);