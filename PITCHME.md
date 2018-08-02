### カスタムフィルタを階層化して<br>テンプレートエンジンを使い倒す
[@cuhey3](http://twitter.com/cuhey3)

---

### 自己紹介

<small>
 
- 20代はニート兼フリーターをして過ごす
- 30から3年間、事務の会社でDIY的に業務アプリを作って過ごす
- 34でIT業界デビュー
- 35でフロントエンドリード（現職）

</small>

---

### ・・・IT業界って人手不足ですね！

---

### テンプレートエンジン、<br>使ってますか？

---

### そもそもテンプレートエンジンって？

<br>

- テンプレート文字列に、変数を流し込んで<br>HTMLを生成するライブラリ
- それ以上でもそれ以下でもない


---

### テンプレートエンジンのイメージ

<br>

- 時代遅れ
- HTMLを生成するだけ
- 拡張性が低い、思うように書けない


---

### ・・・だいたい合ってる

---

### テンプレートエンジンが向くケース

<br>

- ページ表示後のインタラクションが限られる時
- サーバーサイドレンダリングが前提の時
 - 隠蔽したいロジックがある時
- SPAフレームワーク採用が人員的に厳しい時

---

### テンプレートエンジン選定のポイント

<small>
本格的に使用をはじめる前に確認しておこう！
<br>
フレームワーク標準のものが
<br>機能的に十分とは限らないぞ！
</small>
---

### ポイントその１

#### コンテンツテンプレートから、<br>レイアウトテンプレートを呼び出せること

<br>
<small>レイアウトを必ず先に呼ぶ必要があるライブラリは、<br>
サーバーサイドレンダリングとは相性が悪いです。<br>
(最悪ハマります。)</small>

---

### ポイントその２

#### HTML断片を返す子テンプレートを<br>自作できること

<br>
<small>
こちらの機能は普通はあります。
<br>任意のタイプを引数に取れると尚可
</small>

---

### ポイントその３

#### テンプレート上で呼び出せる関数を<br>自作できること

<br>
<small>
関数は任意のタイプの引数を受け取ることができて、<br>また任意のタイプを返却できると捗る。
</small>

---

### テンプレート関数を自作しよう

---

### 使用するテンプレートエンジン

---

Nunjucks
<small>

- 公式 [https://mozilla.github.io/nunjucks/](https://mozilla.github.io/nunjucks/)
- mozilla謹製
- jinja2系
- テンプレートから呼び出す関数は[フィルタ](https://mozilla.github.io/nunjucks/templating.html#filters)と呼ばれる

</small>

--- 

フィルタの使用イメージ

Input

```
{{ "abcdef" | reverse }}
```

Output

```
fedcba
```

<small>
reverseはNunjucksのビルトインフィルタ。
</small>

---

フィルタの使用イメージその２

Input

```
{% for i in [1, 2, 3, 4] | reverse %}
  {{ i }}
{% endfor %}
```

Output

```
4 3 2 1
```

<small>
配列にも適用可能。
</small>

---

自作フィルタの定義

```javascript
var nunjucks = require('nunjucks');
var env = new nunjucks.Environment();

env.addFilter('shorten', function(str, count) {
    return str.slice(0, count || 5);
});
```

自作フィルタを使用する

```
{# Show the first 5 characters #}
A message for you: {{ message|shorten }}

{# Show the first 20 characters #}
A message for you: {{ message|shorten(20) }}
```
<small>
Custom-filters<br>[https://mozilla.github.io/nunjucks/api#custom-filters](https://mozilla.github.io/nunjucks/api#custom-filters)
</small>

---

### ここから本題

---

### フィルタ名の衝突を気にせずに<br>自作フィルタをどんどん作りたい！

---

1.フィルタ名にピリオドを含めて<br>親パッケージがあるかのように演出

```
var nunjucks = require('nunjucks');
var env = new nunjucks.Environment();

env.addFilter('user.helloWorld', function() {
    return 'Hello World!';
});
```

```
{# Hello World! #}
{{ '' | user.helloWorld }}
```

Nunjucksなら普通に動きます。

---

2.自作フィルタを一つのオブジェクトにまとめる


```
var customFilters = {
    user: {
        helloWorld: function(){
            return 'Hello World!';
        },
        goodbyeWorld: function(){
            return 'Goodbye World!';
        }
    }
};
```
なんかそれっぽいですよね？

---

3.まとめてaddFilterする関数を書く

```
function setNestedFunc(env, anyType, parents = []) {
  if (typeof anyType === 'function') {
    env.addFilter(parents.join("."), anyType);
  } else if (anyType && typeof anyType === 'object'
    && !Array.isArray(anyType)) {
    Object.keys(anyType).forEach(function(key) {
      setNestedFunc(env, anyType[key], parents.concat(key));
    });
  }
}

var nunjucks = require('nunjucks');
var env = new nunjucks.Environment();
 
setNestedFunc(env, customFilters);
```

これで自作フィルタを階層化して量産可能！

---

### 自作フィルタをもっと使いやすく

<small>
- import機能を作りたい(パッケージ名を省略）
- 普通に関数のように呼びたい

</small>

---

import機能を持った自作フィルタを書く

```
customFilters.filterImport = function(packageName, ...filterNames) {
  var ctx = this.ctx;
  filterNames.forEach(function(filterName) {
    ctx[filterName] = customFilters[packageName][filterName];
  });
};
```

<small>
`this.ctx`がミソ。ここへの書き込みは、<br>
テンプレート上で変数を宣言するのと同じ効果がある。<br>
（これだけだと作りが甘いのでサンプルコードを参照してください。）
</small>

---

使ってみる

```
{{ 'user' | filterImport('helloWorld') }}
{# Hello World! #}
{{helloWorld()}}
```

<small>
コンテキスト変数にバインドしているので、<br>
逆にパイプラインを使っては書けない。<br>
（けど別に困らないよね？）
</small>
