Ниже — развернутый раздел именно про **матрицы и матричные преобразования** между обычной (декартовой) 3D‑сценой и изометрической/диметрической проекцией, в формате, удобном для встраивания в игровой движок.

---

## 1. Почему вообще нужны матрицы

В движке удобно представлять всё как последовательность операций:

1. Мировые координаты объекта \( (x, y, z) \).
2. Повороты / масштаб / сдвиг.
3. Переход в «камерную» систему координат.
4. Поворот сцены под изометрический угол.
5. Проекция на экран (2D‑координаты).

Все эти шаги удобно описывать **одной 4×4 матрицей** (однородные координаты), которую вы умножаете на вектор позиции. Это позволяет:

- комбинировать повороты, сдвиги, масштаб в одну матрицу;
- легко менять тип проекции (обычная ортографическая → изометрическая → диметрическая);
- реализовать камеры, повороты карты, масштабирование.

---

## 2. Общий конвейер: от 3D‑мира к 2D‑экрану

В терминах матриц (однородные координаты):

\[\mathbf{p}_\text{screen}= \mathbf{P}_\text{proj} \cdot \mathbf{R}_\text{iso} \cdot \mathbf{V}_\text{view} \cdot \mathbf{M}_\text{model} \cdot \mathbf{p}_\text{world}
\]

где:

- \(\mathbf{M}_\text{model}\) — матрица объекта (его локальные повороты/масштаб/позиция);
- \(\mathbf{V}_\text{view}\) — матрица камеры (обычно обратное преобразование позиции/поворота камеры);
- \(\mathbf{R}_\text{iso}\) — матрица поворота, которая «наклоняет» сцену для изометрии;
- \(\mathbf{P}_\text{proj}\) — матрица проекции на плоскость (ортографическая/перспективная/изометрическая);
- \(\mathbf{p}_\text{world} = (x, y, z, 1)^T\).

Для классической изометрии \(\mathbf{R}_\text{iso}\) — это комбинация двух поворотов (см. ниже).

---

## 3. Матрицы поворотов (базовый кирпич)

Для 3D‑движка нужны матрицы **поворота** вокруг осей:

Поворот вокруг оси **X** на угол \(\alpha\):

\[R_x(\alpha) =
\begin{bmatrix}
1 & 0 & 0 & 0 \\
0 & \cos\alpha & -\sin\alpha & 0 \\
0 & \sin\alpha & \cos\alpha & 0 \\
0 & 0 & 0 & 1
\end{bmatrix}
\]

Поворот вокруг оси **Y** на угол \(\beta\):

\[R_y(\beta) =
\begin{bmatrix}
\cos\beta & 0 & \sin\beta & 0 \\
0 & 1 & 0 & 0 \\
-\sin\beta & 0 & \cos\beta & 0 \\
0 & 0 & 0 & 1
\end{bmatrix}
\]

Поворот вокруг оси **Z** на угол \(\gamma\):

\[R_z(\gamma) =
\begin{bmatrix}
\cos\gamma & -\sin\gamma & 0 & 0 \\
\sin\gamma & \cos\gamma & 0 & 0 \\
0 & 0 & 1 & 0 \\
0 & 0 & 0 & 1
\end{bmatrix}
\]

Все дальнейшие матрицы для изометрии — комбинация таких поворотов.

---

## 4. Классическая изометрическая матрица (ортографическая изометрия)

По классике (как в инженерной графике и в Wikipedia), изометрия получается так:

1. Повернуть объект вокруг **оси X** на угол  
   \(\alpha = \arcsin(\tan 30^\circ) \approx 35.264^\circ\).[2]
2. Повернуть вокруг **оси Y** на угол  
   \(\beta = 45^\circ\).[2]
3. Потом сделать ортографическую проекцию на плоскость \(XY\).[2]

То есть сначала:

\[R_\text{iso3D} = R_x(\alpha) \cdot R_y(\beta)[2]
\]

(важен порядок умножения — он зависит от принятой конвенции в движке; здесь предполагаем правую систему и столбцовые векторы).

Википедия даёт итоговую 3×3 матрицу поворота (для вида в первый октант) в виде:[2]

\[\begin{bmatrix}c_x \\ c_y \\ c_z
\end{bmatrix}
=
\frac{1}{\sqrt{6}}
\begin{bmatrix}
\sqrt{3} & 0 & -\sqrt{3} \\
1 & 2 & 1 \\
\sqrt{2} & -\sqrt{2} & \sqrt{2}
\end{bmatrix}
\begin{bmatrix}
a_x \\ a_y \\ a_z
\end{bmatrix}
\]

где \( (a_x, a_y, a_z) \) — исходная 3D‑точка, \( (c_x, c_y, c_z) \) — повернутая.[2]

Далее ортографическая проекция на плоскость XY задаётся матрицей:[2]

\[P_\text{ortho} =
\begin{bmatrix}
1 & 0 & 0 \\
0 & 1 & 0 \\
0 & 0 & 0
\end{bmatrix}
\]

И полная 3×3 матрица изометрической проекции:

\[M_\text{iso} = P_\text{ortho} \cdot R_\text{iso3D}[2]
\]

Если добавить однородные координаты (4×4), просто дописываем четвёртую строку/столбец:

\[M_\text{iso4x4} =
\begin{bmatrix}
M_{11} & M_{12} & M_{13} & 0 \\
M_{21} & M_{22} & M_{23} & 0 \\
0      & 0      & 0      & 0 \\
0      & 0      & 0      & 1
\end{bmatrix}
\]

В игровом движке чаще упрощают и переходят к «игровой» диметрической 2:1, см. ниже.

---

## 5. Игровая «изометрия» 2:1 как матрица

В играх чаще используют не строгую инженерную изометрию, а **диметрическую проекцию 2:1**, где:

\[x_\text{screen} = (x - y)\cdot \frac{W}{2}
\]
\[y_\text{screen} = (x + y)\cdot \frac{H}{2} - z\cdot H_z
\]

где:

- \(W\) — ширина тайла в пикселях;
- \(H\) — высота тайла (обычно \(H = W/2\));
- \(H_z\) — «высота единицы» по оси Z на экране.

Эти формулы можно представить в виде **матричного умножения** 3×3 (без однородности) для 3D→2D:

\[\begin{bmatrix}x_\text{screen} \\
y_\text{screen} \\
1
\end{bmatrix}
=
\begin{bmatrix}
\frac{W}{2} & -\frac{W}{2} & 0 \\
\frac{H}{2} &  \frac{H}{2} & -H_z \\
0           & 0            & 1
\end{bmatrix}
\begin{bmatrix}
x \\
y \\
z
\end{bmatrix}
\]

Для **чисто плоской карты без высоты** (z=0):

\[M_{2D\_\text{iso}} =
\begin{bmatrix}
\frac{W}{2} & -\frac{W}{2} \\
\frac{H}{2} & \frac{H}{2}
\end{bmatrix}
\]

и

\[\begin{bmatrix}x_\text{screen} \\
y_\text{screen}
\end{bmatrix}
=
M_{2D\_\text{iso}}
\begin{bmatrix}
x \\
y
\end{bmatrix}
\]

---

## 6. Обратная матрица (2D экран → 2D мир)

Очень полезно для обработки кликов мыши: нужно по экранным координатам получить координаты клетки.

Берём матрицу:

\[M =
\begin{bmatrix}
\frac{W}{2} & -\frac{W}{2} \\
\frac{H}{2} &  \frac{H}{2}
\end{bmatrix}
\]

Её детерминант:

\[\det M = \frac{W}{2}\cdot\frac{H}{2} - \left(-\frac{W}{2}\cdot\frac{H}{2}\right)
= \frac{WH}{4} + \frac{WH}{4} = \frac{WH}{2}
\]

Обратная матрица (для 2×2:[6][8]):

\[M^{-1} = \frac{1}{\det M}
\begin{bmatrix}
\frac{H}{2} & \frac{W}{2} \\
-\frac{H}{2} & \frac{W}{2}
\end{bmatrix}
=
\frac{2}{WH}
\begin{bmatrix}
\frac{H}{2} & \frac{W}{2} \\
-\frac{H}{2} & \frac{W}{2}
\end{bmatrix}
=
\begin{bmatrix}
\frac{1}{W} & \frac{1}{H} \\
-\frac{1}{W} & \frac{1}{H}
\end{bmatrix}
\]

То есть:

\[\begin{bmatrix}x \\
y
\end{bmatrix}
=
\begin{bmatrix}
\frac{1}{W} & \frac{1}{H} \\
-\frac{1}{W} & \frac{1}{H}
\end{bmatrix}
\begin{bmatrix}
x_\text{screen} \\
y_\text{screen}
\end{bmatrix}
\]

или в кодовом виде:

```cpp
float wx =  xs / W + ys / H;
float wy = -xs / W + ys / H;
```

Это та же формула, что я давал в первом ответе, но полученная строго через матрицы.

---

## 7. Из обычной ортографической проекции в изометрию

Предположим, у вас уже есть:

- система мировых координат \((x, y, z)\);
- матрица **ортографической проекции на XY** (камера сверху, без перспективы):

\[P_\text{top} =
\begin{bmatrix}
1 & 0 & 0 & 0 \\
0 & 1 & 0 & 0 \\
0 & 0 & 0 & 0 \\
0 & 0 & 0 & 1
\end{bmatrix}
\]

Это просто «вид сверху»: \(x_\text{screen} = x, y_\text{screen} = y\).

Чтобы превратить это в изометрию, вам нужно:

1. Повернуть сцену: \(\mathbf{R}_\text{iso3D}\) (как в разд. 4).
2. Потом спроецировать на плоскость.

Полная матрица:

\[M_\text{isoFull} = P_\text{ortho} \cdot R_\text{iso3D}
\]

То есть, **из обычной ортографической «вида сверху» камеры** в изометрическую вы переходите добавлением матрицы поворота, которая наклоняет мир.

Для игровой диметрии 2:1 можно подобрать такие углы поворота \(\alpha, \beta\), чтобы получились привычные коэффициенты \(W/2\) и \(H/2\), но в 2D‑спрайте‑движках обычно просто задают изометрию напрямую как линейное преобразование по \(x,y\), а не выводят из 3D‑поворотов.

---

## 8. Универсальная 4×4 матрица «мир → изометрический экран»

Полезно свести всё к одной 4×4 матрице, чтобы:

- хранить её как **viewProjectionMatrix**;
- умножать на неё все вершины.

Возьмём упрощённую диметрию 2:1 с высотой:

\[x_s = (x - y)\cdot \frac{W}{2}
\]
\[y_s = (x + y)\cdot \frac{H}{2} - z\cdot H_z
\]

В однородных координатах:

\[\begin{bmatrix}x_s \\
y_s \\
z_s \\
w
\end{bmatrix}
=
\begin{bmatrix}
\frac{W}{2} & -\frac{W}{2} & 0      & 0 \\
\frac{H}{2} &  \frac{H}{2} & -H_z   & 0 \\
0           & 0            & 1      & 0 \\
0           & 0            & 0      & 1
\end{bmatrix}
\begin{bmatrix}
x \\
y \\
z \\
1
\end{bmatrix}
\]

Здесь:

- первая строка — базисный вектор для оси X на экране;
- вторая строка — базисный вектор для оси Y и влияния высоты;
- третья строка можно использовать как «depth» (например, \(z_s = x + y + k z\)) для сортировки;
- четвёртая строка — для однородных координат.

Вы можете заменить третью строку на:

\[[1 \quad 1 \quad \lambda \quad 0]
\]

и тогда:

\[z_s = x + y + \lambda z
\]

что удобно как **z‑значение для сортировки** (чем больше z_s, тем позже рисуем).

---

## 9. Объединение с камерой и трансформациями объектов

Обычно архитектура движка такая:

1. Матрица модели объекта:

\[M_\text{model} = T \cdot R \cdot S
\]

- \(T\) — 4×4 матрица переноса;
- \(R\) — матрица поворота;
- \(S\) — матрица масштаба.[4][6][8]

2. Матрица камеры (view):

\[V = (T_\text{camera} \cdot R_\text{camera})^{-1}
\]

3. Матрица изометрической проекции:

- либо классический \(M_\text{isoFull}\) из разд. 4;
- либо простая «игровая» диметрия 2:1 из разд. 8.

4. Единственная итоговая матрица для рендера:

\[M_\text{VP} = M_\text{iso} \cdot V
\]

и для каждой вершины:

\[p_\text{screen} = M_\text{VP} \cdot M_\text{model} \cdot p_\text{local}
\]

Это тот же подход, что используется в обычном 3D, только вместо перспективной/ортографической проекции сюда подставлена матрица изометрической/диметрической.

---

## 10. Повороты сцены / мини‑камера в изометрии как матрица

Если вы хотите в изометрической игре «поворачивать карту» (например, 4 ориентации: север‑восток‑юг‑запад), это можно сделать **дополнительной матрицей поворота в мировой плоскости XY**.

Например, поворот карты на 90° по часовой:

\[R_\text{map90} =
\begin{bmatrix}
0 & 1 & 0 & 0 \\
-1 & 0 & 0 & 0 \\
0 & 0 & 1 & 0 \\
0 & 0 & 0 & 1
\end{bmatrix}
\]

Тогда:

\[M_\text{isoRot} = M_\text{iso} \cdot R_\text{map90}
\]

И вы не меняете логику мира — меняется только матрица, которую вы используете для рендера и обратное преобразование для кликов.

---

## 11. Что важно реализовать в движке на практике

1. **Базовые 4×4 операции с матрицами**:
   - умножение матрицы на матрицу;
   - умножение матрицы на вектор (x, y, z, 1);
   - вычисление обратной матрицы минимум для 2×2/3×3, а лучше и для 4×4 (или хранить отдельную матрицу inverse, как в 3D‑движках).[4][6][8]

2. **Фабрики матриц**:
   - `MakeTranslation(tx, ty, tz)`;
   - `MakeRotationX(a), MakeRotationY(b), MakeRotationZ(g)`;
   - `MakeScale(sx, sy, sz)`;
   - `MakeIso2to1(tileW, tileH, tileZ)` — возвращает матрицу, как в разд. 8;
   - `MakeIsoClassic()` — через углы \(\alpha, \beta\) для строгой изометрии.[2][3]

3. **Инвертирование изометрической матрицы для кликов**:
   - хранить `M_iso` и `M_iso_inv`;
   - при клике `world = M_iso_inv * screen`.

4. **Единый интерфейс**:
   - например, всё, что у вас выводится на экран, всегда умножается на `viewProjectionMatrix`;
   - для обычной 2D‑камеры это одна матрица, для изометрической — другая, но код рендера не меняется.


# Реализация матриц для изометрического движка на JavaScript

## 1. Базовая структура: класс матрицы 4×4

```javascript
class Mat4 {
  constructor() {
    // Матрица хранится в виде плоского массива (column-major, как в WebGL)
    // [ m00 m10 m20 m30  m01 m11 m21 m31  m02 m12 m22 m32  m03 m13 m23 m33 ]
    this.m = new Float32Array(16);
    this.identity();
  }

  // Единичная матрица
  identity() {
    const m = this.m;
    m[0]=1; m[1]=0; m[2]=0; m[3]=0;
    m[4]=0; m[5]=1; m[6]=0; m[7]=0;
    m[8]=0; m[9]=0; m[10]=1; m[11]=0;
    m[12]=0; m[13]=0; m[14]=0; m[15]=1;
    return this;
  }

  // Копирование
  clone() {
    const out = new Mat4();
    out.m.set(this.m);
    return out;
  }

  // Установка значений напрямую (row-major для удобства чтения)
  set(
    a, b, c, d,
    e, f, g, h,
    i, j, k, l,
    n, o, p, q
  ) {
    const m = this.m;
    m[0]=a; m[4]=b; m[8]=c;  m[12]=d;
    m[1]=e; m[5]=f; m[9]=g;  m[13]=h;
    m[2]=i; m[6]=j; m[10]=k; m[14]=l;
    m[3]=n; m[7]=o; m[11]=p; m[15]=q;
    return this;
  }
}
```

## 2. Умножение матриц

```javascript
// this = a * b
Mat4.prototype.multiplyMatrices = function(a, b) {
  const ae = a.m, be = b.m, te = this.m;

  const a11 = ae[0], a12 = ae[4], a13 = ae[8],  a14 = ae[12];
  const a21 = ae[1], a22 = ae[5], a23 = ae[9],  a24 = ae[13];
  const a31 = ae[2], a32 = ae[6], a33 = ae[10], a34 = ae[14];
  const a41 = ae[3], a42 = ae[7], a43 = ae[11], a44 = ae[15];

  const b11 = be[0], b12 = be[4], b13 = be[8],  b14 = be[12];
  const b21 = be[1], b22 = be[5], b23 = be[9],  b24 = be[13];
  const b31 = be[2], b32 = be[6], b33 = be[10], b34 = be[14];
  const b41 = be[3], b42 = be[7], b43 = be[11], b44 = be[15];

  te[0]  = a11*b11 + a12*b21 + a13*b31 + a14*b41;
  te[4]  = a11*b12 + a12*b22 + a13*b32 + a14*b42;
  te[8]  = a11*b13 + a12*b23 + a13*b33 + a14*b43;
  te[12] = a11*b14 + a12*b24 + a13*b34 + a14*b44;

  te[1]  = a21*b11 + a22*b21 + a23*b31 + a24*b41;
  te[5]  = a21*b12 + a22*b22 + a23*b32 + a24*b42;
  te[9]  = a21*b13 + a22*b23 + a23*b33 + a24*b43;
  te[13] = a21*b14 + a22*b24 + a23*b34 + a24*b44;

  te[2]  = a31*b11 + a32*b21 + a33*b31 + a34*b41;
  te[6]  = a31*b12 + a32*b22 + a33*b32 + a34*b42;
  te[10] = a31*b13 + a32*b23 + a33*b33 + a34*b43;
  te[14] = a31*b14 + a32*b24 + a33*b34 + a34*b44;

  te[3]  = a41*b11 + a42*b21 + a43*b31 + a44*b41;
  te[7]  = a41*b12 + a42*b22 + a43*b32 + a44*b42;
  te[11] = a41*b13 + a42*b23 + a43*b33 + a44*b43;
  te[15] = a41*b14 + a42*b24 + a43*b34 + a44*b44;

  return this;
};

// Удобное "правое" умножение: this = this * other
Mat4.prototype.multiply = function(other) {
  return this.multiplyMatrices(this.clone(), other);
};
```

## 3. Базовые трансформации (фабрики матриц)

```javascript
// Перенос (translation)
Mat4.makeTranslation = function(tx, ty, tz) {
  const out = new Mat4();
  out.set(
    1, 0, 0, tx,
    0, 1, 0, ty,
    0, 0, 1, tz,
    0, 0, 0, 1
  );
  return out;
};

// Масштаб
Mat4.makeScale = function(sx, sy, sz) {
  const out = new Mat4();
  out.set(
    sx, 0,  0,  0,
    0,  sy, 0,  0,
    0,  0,  sz, 0,
    0,  0,  0,  1
  );
  return out;
};

// Поворот вокруг X
Mat4.makeRotationX = function(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const out = new Mat4();
  out.set(
    1, 0,  0, 0,
    0, c, -s, 0,
    0, s,  c, 0,
    0, 0,  0, 1
  );
  return out;
};

// Поворот вокруг Y
Mat4.makeRotationY = function(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const out = new Mat4();
  out.set(
     c, 0, s, 0,
     0, 1, 0, 0,
    -s, 0, c, 0,
     0, 0, 0, 1
  );
  return out;
};

// Поворот вокруг Z
Mat4.makeRotationZ = function(angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const out = new Mat4();
  out.set(
    c, -s, 0, 0,
    s,  c, 0, 0,
    0,  0, 1, 0,
    0,  0, 0, 1
  );
  return out;
};
```

## 4. Изометрические матрицы

```javascript
// Игровая диметрия 2:1
// tileW - ширина тайла, tileH - высота тайла (обычно tileW/2),
// tileZ - сколько пикселей по экрану занимает 1 единица высоты
Mat4.makeIso2to1 = function(tileW, tileH, tileZ) {
  const hw = tileW / 2;
  const hh = tileH / 2;
  const out = new Mat4();
  out.set(
    hw, -hw,  0,    0,
    hh,  hh, -tileZ, 0,
    1,   1,   0,    0,   // третья строка - depth для сортировки (x + y)
    0,   0,   0,    1
  );
  return out;
};

// Классическая (инженерная) изометрия
// через два поворота: вокруг X на arcsin(tan(30°)) и вокруг Y на 45°
Mat4.makeIsoClassic = function() {
  const alpha = Math.asin(Math.tan(Math.PI / 6)); // ≈ 35.264°
  const beta  = Math.PI / 4;                       // 45°

  const Rx = Mat4.makeRotationX(alpha);
  const Ry = Mat4.makeRotationY(beta);

  const out = new Mat4();
  out.multiplyMatrices(Rx, Ry);
  return out;
};
```

## 5. Обратная матрица 2×2 (для кликов мыши)

Для логики «экран → мир» обычно достаточно 2×2 матрицы — это намного быстрее, чем инвертировать 4×4.

```javascript
class Mat2 {
  constructor(a = 1, b = 0, c = 0, d = 1) {
    // [ a  b ]
    // [ c  d ]
    this.a = a; this.b = b;
    this.c = c; this.d = d;
  }

  // Изометрическая 2D матрица (без z)
  static makeIso2D(tileW, tileH) {
    const hw = tileW / 2;
    const hh = tileH / 2;
    return new Mat2(hw, -hw, hh, hh);
  }

  // Обратная матрица 2x2
  inverse() {
    const det = this.a * this.d - this.b * this.c;
    if (Math.abs(det) < 1e-10) {
      throw new Error('Matrix is not invertible');
    }
    const invDet = 1 / det;
    return new Mat2(
       this.d * invDet, -this.b * invDet,
      -this.c * invDet,  this.a * invDet
    );
  }

  // Применение к вектору
  apply(x, y) {
    return {
      x: this.a * x + this.b * y,
      y: this.c * x + this.d * y
    };
  }
}
```

## 6. Обратная матрица 4×4 (универсальная, через адъюгат)

```javascript
Mat4.prototype.invert = function() {
  const m = this.m;
  const inv = new Float32Array(16);

  inv[0] =  m[5]*m[10]*m[15] - m[5]*m[11]*m[14] - m[9]*m[6]*m[15] +
            m[9]*m[7]*m[14] + m[13]*m[6]*m[11] - m[13]*m[7]*m[10];
  inv[4] = -m[4]*m[10]*m[15] + m[4]*m[11]*m[14] + m[8]*m[6]*m[15] -
            m[8]*m[7]*m[14] - m[12]*m[6]*m[11] + m[12]*m[7]*m[10];
  inv[8] =  m[4]*m[9]*m[15]  - m[4]*m[11]*m[13] - m[8]*m[5]*m[15] +
            m[8]*m[7]*m[13]  + m[12]*m[5]*m[11] - m[12]*m[7]*m[9];
  inv[12]= -m[4]*m[9]*m[14]  + m[4]*m[10]*m[13] + m[8]*m[5]*m[14] -
            m[8]*m[6]*m[13]  - m[12]*m[5]*m[10] + m[12]*m[6]*m[9];
  inv[1] = -m[1]*m[10]*m[15] + m[1]*m[11]*m[14] + m[9]*m[2]*m[15] -
            m[9]*m[3]*m[14]  - m[13]*m[2]*m[11] + m[13]*m[3]*m[10];
  inv[5] =  m[0]*m[10]*m[15] - m[0]*m[11]*m[14] - m[8]*m[2]*m[15] +
            m[8]*m[3]*m[14]  + m[12]*m[2]*m[11] - m[12]*m[3]*m[10];
  inv[9] = -m[0]*m[9]*m[15]  + m[0]*m[11]*m[13] + m[8]*m[1]*m[15] -
            m[8]*m[3]*m[13]  - m[12]*m[1]*m[11] + m[12]*m[3]*m[9];
  inv[13]=  m[0]*m[9]*m[14]  - m[0]*m[10]*m[13] - m[8]*m[1]*m[14] +
            m[8]*m[2]*m[13]  + m[12]*m[1]*m[10] - m[12]*m[2]*m[9];
  inv[2] =  m[1]*m[6]*m[15]  - m[1]*m[7]*m[14]  - m[5]*m[2]*m[15] +
            m[5]*m[3]*m[14]  + m[13]*m[2]*m[7]  - m[13]*m[3]*m[6];
  inv[6] = -m[0]*m[6]*m[15]  + m[0]*m[7]*m[14]  + m[4]*m[2]*m[15] -
            m[4]*m[3]*m[14]  - m[12]*m[2]*m[7]  + m[12]*m[3]*m[6];
  inv[10]=  m[0]*m[5]*m[15]  - m[0]*m[7]*m[13]  - m[4]*m[1]*m[15] +
            m[4]*m[3]*m[13]  + m[12]*m[1]*m[7]  - m[12]*m[3]*m[5];
  inv[14]= -m[0]*m[5]*m[14]  + m[0]*m[6]*m[13]  + m[4]*m[1]*m[14] -
            m[4]*m[2]*m[13]  - m[12]*m[1]*m[6]  + m[12]*m[2]*m[5];
  inv[3] = -m[1]*m[6]*m[11]  + m[1]*m[7]*m[10]  + m[5]*m[2]*m[11] -
            m[5]*m[3]*m[10]  - m[9]*m[2]*m[7]   + m[9]*m[3]*m[6];
  inv[7] =  m[0]*m[6]*m[11]  - m[0]*m[7]*m[10]  - m[4]*m[2]*m[11] +
            m[4]*m[3]*m[10]  + m[8]*m[2]*m[7]   - m[8]*m[3]*m[6];
  inv[11]= -m[0]*m[5]*m[11]  + m[0]*m[7]*m[9]   + m[4]*m[1]*m[11] -
            m[4]*m[3]*m[9]   - m[8]*m[1]*m[7]   + m[8]*m[3]*m[5];
  inv[15]=  m[0]*m[5]*m[10]  - m[0]*m[6]*m[9]   - m[4]*m[1]*m[10] +
            m[4]*m[2]*m[9]   + m[8]*m[1]*m[6]   - m[8]*m[2]*m[5];

  let det = m[0]*inv[0] + m[1]*inv[4] + m[2]*inv[8] + m[3]*inv[12];
  if (Math.abs(det) < 1e-10) {
    throw new Error('Matrix is not invertible');
  }
  det = 1.0 / det;

  for (let i = 0; i < 16; i++) inv[i] *= det;

  this.m.set(inv);
  return this;
};
```

## 7. Применение матрицы к вектору

```javascript
class Vec3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x; this.y = y; this.z = z;
  }
}

// Применение Mat4 к Vec3 (с w=1)
Mat4.prototype.transformPoint = function(v) {
  const m = this.m;
  const x = v.x, y = v.y, z = v.z;

  const rx = m[0]*x + m[4]*y + m[8]*z  + m[12];
  const ry = m[1]*x + m[5]*y + m[9]*z  + m[13];
  const rz = m[2]*x + m[6]*y + m[10]*z + m[14];
  const rw = m[3]*x + m[7]*y + m[11]*z + m[15];

  if (rw !== 1 && rw !== 0) {
    return new Vec3(rx/rw, ry/rw, rz/rw);
  }
  return new Vec3(rx, ry, rz);
};
```

## 8. Класс камеры изометрического движка

```javascript
class IsoCamera {
  constructor(tileW = 64, tileH = 32, tileZ = 16) {
    this.tileW = tileW;
    this.tileH = tileH;
    this.tileZ = tileZ;

    this.x = 0;       // позиция камеры в мире
    this.y = 0;
    this.zoom = 1;

    // Матрицы для рендера
    this.projection   = Mat4.makeIso2to1(tileW, tileH, tileZ);
    this.view         = new Mat4();
    this.viewProjection = new Mat4();

    // Для обратного преобразования (клик → мир)
    this.iso2D    = Mat2.makeIso2D(tileW, tileH);
    this.iso2DInv = this.iso2D.inverse();

    this.updateMatrices();
  }

  setPosition(x, y) {
    this.x = x;
    this.y = y;
    this.updateMatrices();
  }

  setZoom(zoom) {
    this.zoom = zoom;
    this.updateMatrices();
  }

  updateMatrices() {
    // View = scale(zoom) * translate(-cameraX, -cameraY, 0)
    const T = Mat4.makeTranslation(-this.x, -this.y, 0);
    const S = Mat4.makeScale(this.zoom, this.zoom, 1);
    this.view.multiplyMatrices(S, T);

    // ViewProjection = Projection * View
    this.viewProjection.multiplyMatrices(this.projection, this.view);
  }

  // Мир → экран
  worldToScreen(wx, wy, wz = 0) {
    const sx = (wx - wy) * (this.tileW / 2) * this.zoom - this.x;
    const sy = ((wx + wy) * (this.tileH / 2) - wz * this.tileZ) * this.zoom - this.y;
    return { x: sx, y: sy };
  }

  // Экран → мир (для кликов мыши, по плоскости z=0)
  screenToWorld(sx, sy) {
    // компенсация камеры и зума
    const x = (sx + this.x) / this.zoom;
    const y = (sy + this.y) / this.zoom;
    // применение обратной 2D матрицы
    return this.iso2DInv.apply(x, y);
  }

  // Получение координат тайла из координат клика
  screenToTile(sx, sy) {
    const w = this.screenToWorld(sx, sy);
    return {
      x: Math.floor(w.x),
      y: Math.floor(w.y)
    };
  }
}
```

## 9. Пример использования

```javascript
// === Инициализация ===
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const camera = new IsoCamera(64, 32, 16);
camera.setPosition(-canvas.width / 2, -100); // центрируем мир

// === Карта ===
const map = [
  [1, 1, 1, 2, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 2, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 1, 1, 1, 1],
];

// === Рендер тайла ромбом ===
function drawTile(wx, wy, wz, color) {
  const p = camera.worldToScreen(wx, wy, wz);
  const hw = (camera.tileW / 2) * camera.zoom;
  const hh = (camera.tileH / 2) * camera.zoom;

  ctx.beginPath();
  ctx.moveTo(p.x,      p.y - hh);
  ctx.lineTo(p.x + hw, p.y);
  ctx.lineTo(p.x,      p.y + hh);
  ctx.lineTo(p.x - hw, p.y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.stroke();
}

// === Главный цикл ===
function render() {
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Рендер с правильным порядком (painter's algorithm)
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      const h = map[y][x];
      const color = h === 0 ? '#4a4' : h === 1 ? '#888' : '#a64';
      drawTile(x, y, h, color);
    }
  }
}

// === Обработка кликов ===
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const sx = e.clientX - rect.left;
  const sy = e.clientY - rect.top;

  const tile = camera.screenToTile(sx, sy);
  console.log('Clicked tile:', tile);

  if (tile.x >= 0 && tile.y >= 0 &&
      tile.y < map.length && tile.x < map[0].length) {
    map[tile.y][tile.x] = (map[tile.y][tile.x] + 1) % 3;
    render();
  }
});

// === Скроллинг камеры ===
document.addEventListener('keydown', (e) => {
  const speed = 20;
  if (e.key === 'ArrowLeft')  camera.setPosition(camera.x - speed, camera.y);
  if (e.key === 'ArrowRight') camera.setPosition(camera.x + speed, camera.y);
  if (e.key === 'ArrowUp')    camera.setPosition(camera.x, camera.y - speed);
  if (e.key === 'ArrowDown')  camera.setPosition(camera.x, camera.y + speed);
  render();
});

render();
```

## 10. Бонус: применение matrix через `CanvasRenderingContext2D.setTransform`

Для производительности можно использовать встроенный transform-стек canvas:

```javascript
function applyIsoTransform(ctx, camera) {
  const hw = camera.tileW / 2 * camera.zoom;
  const hh = camera.tileH / 2 * camera.zoom;

  // setTransform(a, b, c, d, e, f) применяет матрицу:
  // | a c e |
  // | b d f |
  // | 0 0 1 |
  // где (a,b) - первый столбец, (c,d) - второй, (e,f) - перенос
  ctx.setTransform(
    hw,  hh,    // первый столбец: куда уходит ось X
    -hw, hh,    // второй столбец: куда уходит ось Y
    -camera.x,  // tx
    -camera.y   // ty
  );
}

// Теперь можно рисовать в "мировых" координатах:
function drawTileFast(wx, wy, color) {
  ctx.beginPath();
  ctx.moveTo(wx,     wy);
  ctx.lineTo(wx + 1, wy);
  ctx.lineTo(wx + 1, wy + 1);
  ctx.lineTo(wx,     wy + 1);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}
```

## Резюме архитектуры

```
Mat4       → универсальная 4×4 матрица (3D трансформации)
Mat2       → быстрая 2×2 для логики клик/мир
IsoCamera  → инкапсулирует projection × view, кэширует обратную матрицу
Vec3       → точки и векторы
```

Этой базы достаточно для построения полноценного 2D/2.5D изометрического движка: загрузка карт, скроллинг, зум, клики, многоэтажные объекты, сортировка по глубине через depth = x + y + λz.