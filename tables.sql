-- Criamos um Database --
--CREATE DATABASE ImersaoNudesJs
--GO
USE ImersaoNudesJs
GO

/*CREATE SCHEMA Heroes
GO*/

CREATE TABLE Heroes
(
    ID INT IDENTITY PRIMARY KEY,
    NOME VARCHAR(100) NOT NULL,
    DATA_NASCIMENTO VARCHAR(100) NOT NULL,
    PODER VARCHAR(100) NOT NULL,
    CLASSE_ID  INT NOT NULL
);
GO

CREATE TABLE Classe
(
    ID INT IDENTITY PRIMARY KEY,
    DESCRICAO VARCHAR(100) NOT NULL
);
GO

INSERT INTO DBO.Classe VALUES
(
  'warrior'
);
GO

INSERT INTO DBO.Classe VALUES
(
  'mago'
);
GO

INSERT INTO DBO.Classe VALUES
(
  'rogue'
);
GO

INSERT INTO DBO.Classe VALUES
(
  'archer'
);
GO

--PARA INSERIR AS INFORMAÇÕES, PRECISAMOS ACESSAR O SQL
--sqlcmd /E /S HOME

