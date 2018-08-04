### カスタムフィルタを階層化して<br>テンプレートエンジンを使い倒す
[@cuhey3](http://twitter.com/cuhey3)

---

### アジェンダ

<br>

- 前半:　テンプレートエンジンの概要
- 後半:　使用がはかどるちょっとしたハック

---

#### スライド
https://gitpitch.com/cuhey3/js180804

<br>

#### サンプルコード
https://github.com/Cuhey3/js180804

---

### 自己紹介

<small>
 
- 20代はニート兼フリーターをして過ごす |
- 30から3年間、事務の会社でDIY的に業務アプリを作って過ごす |
- 34でIT業界デビュー |
- 35でフロントエンドリード（現職）<br>金融系のスクラッチプロジェクト。 |

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

- ページ表示後のインタラクションが限られる時 |
- サーバーサイドレンダリングが前提の時 |
 - 隠蔽したいロジックがある時 | 
- SPAフレームワーク採用が人員的に厳しい時 |

---

### テンプレートエンジン選定のポイント

本格的に導入する前にチェックしておこう！

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
関数は、任意のタイプの引数を受け取ることができて、<br>任意のタイプを返却できると捗る。
</small>

---

### テンプレート関数を自作しよう

---

### 使用するテンプレートエンジン

---

### Nunjucks

- 公式 [https://mozilla.github.io/nunjucks/](https://mozilla.github.io/nunjucks/)
- mozilla謹製
- jinja2系
- テンプレートから呼び出す関数は<br>[フィルタ](https://mozilla.github.io/nunjucks/templating.html#filters)と呼ぶ

--- 

#### フィルタの使用イメージその１

Input

```
<p>{{ "123456" | replace("4", ".")}}</p>
<p>{{ "abcdef" | reverse }}</p>
```

Output

```
<p>123.56</p>
<p>fedcba</p>
```

<small>
replace, reverseはNunjucksのビルトインフィルタ。
</small>

---

#### フィルタの使用イメージその２

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
reverseフィルタは配列にも適用可能。
</small>

---

#### 自作フィルタの作り方

nunjucksモジュールにaddFilterするだけ！

```javascript
var nunjucks = require('nunjucks');
var env = new nunjucks.Environment();

env.addFilter('shorten', function(str, count) {
    return str.slice(0, count || 5);
});
```

<small>
Custom-filters<br>[https://mozilla.github.io/nunjucks/api#custom-filters](https://mozilla.github.io/nunjucks/api#custom-filters)
</small>

---

#### 自作フィルタを使用する

```
{# Show the first 5 characters #}
A message for you: {{ message|shorten }}

{# Show the first 20 characters #}
A message for you: {{ message|shorten(20) }}
```

---

### ここから本題

---

- フィルタは基本的にグローバル関数扱い
- 名前の衝突を気にせずに<br>自作フィルタをどんどん作りたい！ | 
- 3ステップでその辺を整備します | 

---

1.フィルタ名にピリオドを含めて<br>親パッケージがあるかのように演出

```
var nunjucks = require('nunjucks');
var env = new nunjucks.Environment();

env.addFilter('user.helloWorld', function() {
    return 'Hello World!';
});
```

Nunjucksなら普通に呼び出せる

```
{# Hello World! #}
{{ '' | user.helloWorld }}
```

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
・・・なんかそれっぽいですよね？

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

- import機能を作りたい
  - パッケージ名を毎回書きたくない
- 普通に関数のように呼びたい

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
コンテキスト変数にセットしているので、<br>
逆にパイプラインを使って書くことはできない。<br>
（けど別に困らないよね？）
</small>

---

### まとめ

---

#### ちょっとしたハックで<br>テンプレートエンジンを楽しく

---

### ご清聴ありがとうございました
