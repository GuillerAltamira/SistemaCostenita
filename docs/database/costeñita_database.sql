CREATE TABLE [PRODUCTO] (
  [id_producto] int UNIQUE PRIMARY KEY NOT NULL IDENTITY(1, 1),
  [nombre] varchar(100) NOT NULL,
  [presentacion] varchar(50) NOT NULL,
  [estado] varchar(20) NOT NULL DEFAULT 'ACTIVO'
)
GO

CREATE TABLE [PROVEEDOR] (
  [id_proveedor] int UNIQUE PRIMARY KEY NOT NULL IDENTITY(1, 1),
  [nombre] varchar(100) NOT NULL,
  [telefono] varchar(20) UNIQUE NOT NULL,
  [localidad] varchar(100) NOT NULL
)
GO

CREATE TABLE [COMPRA] (
  [id_compra] int UNIQUE PRIMARY KEY NOT NULL IDENTITY(1, 1),
  [fecha] date NOT NULL,
  [cantidad] decimal(10,2) NOT NULL,
  [unidad_medida] varchar(20) NOT NULL,
  [estado] varchar(20) NOT NULL DEFAULT 'REGISTRADA',
  [id_proveedor] int NOT NULL,
  [id_producto] int NOT NULL
)
GO

CREATE TABLE [INVENTARIO] (
  [id_inventario] int UNIQUE PRIMARY KEY NOT NULL IDENTITY(1, 1),
  [stock_actual] decimal(10,2) NOT NULL DEFAULT (0),
  [unidad_medida] varchar(20) NOT NULL,
  [id_producto] int UNIQUE NOT NULL
)
GO

CREATE TABLE [MOVIMIENTO_INVENTARIO] (
  [id_movimiento] int UNIQUE PRIMARY KEY NOT NULL IDENTITY(1, 1),
  [tipo] varchar(20) NOT NULL,
  [cantidad] decimal(10,2) NOT NULL,
  [fecha] date NOT NULL,
  [id_producto] int NOT NULL
)
GO

CREATE UNIQUE INDEX [PRODUCTO_index_0] ON [PRODUCTO] ("nombre", "presentacion")
GO

EXEC sp_addextendedproperty
@name = N'Table_Description',
@value = 'Tabla que almacena los productos comercializados por Costeñita.

NORMALIZACION:
1FN: Todos los atributos contienen valores atomicos.
2FN: La PK es simple (id_producto), por lo que no existen dependencias parciales.
3FN: Todos los atributos no clave dependen directamente de id_producto.

RESTRICCIONES:
- id_producto: PK, autoincremental, NOT NULL, UNIQUE.
- nombre: obligatorio.
- presentacion: obligatoria.
- nombre + presentacion: UNIQUE para evitar duplicados.
- estado: valores permitidos ACTIVO o INACTIVO.
',
@level0type = N'Schema', @level0name = 'dbo',
@level1type = N'Table',  @level1name = 'PRODUCTO';
GO

EXEC sp_addextendedproperty
@name = N'Table_Description',
@value = 'Tabla que almacena los proveedores o apicultores de Costeñita.

NORMALIZACION:
1FN: Cada atributo contiene un unico valor.
2FN: La PK es simple (id_proveedor).
3FN: Los datos del proveedor dependen directamente de id_proveedor.

RESTRICCIONES:
- id_proveedor: PK, autoincremental, NOT NULL, UNIQUE.
- nombre: obligatorio.
- telefono: obligatorio y UNIQUE.
- localidad: obligatoria.
',
@level0type = N'Schema', @level0name = 'dbo',
@level1type = N'Table',  @level1name = 'PROVEEDOR';
GO

EXEC sp_addextendedproperty
@name = N'Table_Description',
@value = 'Tabla que registra las compras de miel realizadas por Costeñita.

NORMALIZACION:
1FN: Los atributos son atomicos y no contienen listas.
2FN: La PK es simple (id_compra), por lo que no existen dependencias parciales.
3FN: Los datos del proveedor y producto no se duplican en COMPRA.
     Se utilizan claves foraneas para relacionar las entidades.

RESTRICCIONES:
- id_compra: PK, autoincremental, NOT NULL, UNIQUE.
- fecha: obligatoria.
- cantidad: obligatoria y debe ser mayor que cero.
- unidad_medida: GRAMOS, KG o UNIDAD (Gestión por Peso).
- estado: REGISTRADA o ANULADA.
- id_proveedor: FK obligatoria.
- id_producto: FK obligatoria.
',
@level0type = N'Schema', @level0name = 'dbo',
@level1type = N'Table',  @level1name = 'COMPRA';
GO

EXEC sp_addextendedproperty
@name = N'Table_Description',
@value = 'Tabla que representa el stock actual de cada producto.

NORMALIZACION:
1FN: Los atributos contienen valores atomicos.
2FN: La PK es simple.
3FN: Los datos dependen directamente de id_inventario.
     id_producto funciona como FK y ademas UNIQUE para establecer
     una relacion uno a uno con PRODUCTO.

RESTRICCIONES:
- id_inventario: PK, autoincremental, NOT NULL, UNIQUE.
- stock_actual: obligatorio y no puede ser negativo.
- unidad_medida: GRAMOS, KG o UNIDAD (Gestión por Peso).
- id_producto: FK obligatoria y UNIQUE.
',
@level0type = N'Schema', @level0name = 'dbo',
@level1type = N'Table',  @level1name = 'INVENTARIO';
GO

EXEC sp_addextendedproperty
@name = N'Table_Description',
@value = 'Tabla que registra los movimientos de inventario.

Para el alcance actual de HU06 se utiliza principalmente:
tipo = ENTRADA.

NORMALIZACION:
1FN: Todos los atributos son atomicos.
2FN: La PK es simple.
3FN: Todos los atributos dependen directamente de id_movimiento.

RESTRICCIONES:
- id_movimiento: PK, autoincremental, NOT NULL, UNIQUE.
- tipo: ENTRADA o SALIDA.
- cantidad: obligatoria y mayor que cero.
- fecha: obligatoria.
- id_producto: FK obligatoria.
',
@level0type = N'Schema', @level0name = 'dbo',
@level1type = N'Table',  @level1name = 'MOVIMIENTO_INVENTARIO';
GO

ALTER TABLE [COMPRA] ADD FOREIGN KEY ([id_proveedor]) REFERENCES [PROVEEDOR] ([id_proveedor])
GO

ALTER TABLE [COMPRA] ADD FOREIGN KEY ([id_producto]) REFERENCES [PRODUCTO] ([id_producto])
GO

ALTER TABLE [INVENTARIO] ADD FOREIGN KEY ([id_producto]) REFERENCES [PRODUCTO] ([id_producto])
GO

ALTER TABLE [MOVIMIENTO_INVENTARIO] ADD FOREIGN KEY ([id_producto]) REFERENCES [PRODUCTO] ([id_producto])
GO
