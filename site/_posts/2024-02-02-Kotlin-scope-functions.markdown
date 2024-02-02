---
layout: post
title:  "'scope' Funktionen in kotlin"
date:   2024-02-02 14:28:00 +0200
categories: kotlin
---

In Kotlin gibt es die sogenannten "Scope Functions"  **let**, **run**, **with**, **apply** und **also**. 
Ihr Hauptzweck besteht darin, die Arbeit mit Objekten in Kotlin zu vereinfachen und den Code lesbarer zu gestalten
indem sie es erlauben Codeblöcke in Form von Lambda-Ausdrücken auf bestimmten Objekten auszuführen und dabei den Kontext zu steuern.

> Basically, these functions all perform the same action: execute a block of code on an object. What's different is how this object  becomes available inside the block and what the result of the whole expression is.
<p class="citeref">Dokumentation auf kotlinlang.org</p> 

<br>
#### Übersicht über die "Scope Functions"

|   |Zweck | Beispiel | Signatur |
|----------|---------|---------|---------------------|
| `let`    | Lambda ausführen auf <b>obj</b> / Ergebnis der Lambda-Expression liefern | `val result = obj.let { ... }` | `inline fun <T, R> T.let(block: (T) -> R): R` |
| `run`    | Execute on context object, return result | `val result = obj.run { ... }` | `inline fun <T, R> T.run(block: T.() -> R): R` |
| `with`   | Execute on any object, no need for it to be receiver | `val result = with(obj) { ... }` | `inline fun <T, R> with(receiver: T, block: T.() -> R): R` |
| `apply`  | Apply configurations, return modified object | `val modifiedObj = obj.apply { ... }` | `inline fun <T> T.apply(block: T.() -> Unit): T` |
| `also`   | Execute and return original object | `val result = obj.also { ... }` | `inline fun <T> T.also(block: (T) -> Unit): T` |

<br>
#### let und run 

Sowohl **let** als auch **run** liefern als Ergebnis den Wert der Lambda-Expression zurück.

##### let

{% highlight java %}
    val sb = StringBuilder()
    val letRes: String = sb.let {
        // receiver "sb" wird der Lambda Expression übergeben und ist hier
        // implizit als "it" verfügbar.
        // Statt des impliziten "it" könnte ein eigener anders benannter Parameter verwendet werden.
        it.append(42)
        it.append("Let")
        it.toString()
    }
    println(letRes)     // 42Let
{% endhighlight %}

#### run

{% highlight java %}
    var someValue = 42
    val runRes: String = run {
        // "run" ist eine "einfache" Funktion (ohne Parameter) und keine Methode.
        // "Run" führt einfach nur die Lambda Expression aus und liefert ihr
        // Ergebnis zurück. Vorteil ist, daß die mit "run" ausgeführte Lambda
        // einen eigenen Scope öffnet.
        val someValue = 142  // neue Definition von 'someValue' in diesem Kontext
        StringBuilder()
            .append(someValue)
            .append("Run")
            .toString()
    }
    // someValue ist hier wieder 42
    println(runRes)     // --> 42
    println(someValue)  // --> 142Run
{% endhighlight %}

#### with, apply und also

Sowohl **with** als auch **apply**  sowie **also** ignorieren den Wert der Lambda-Expression und liefern
stattdessen ihren 'receiver' (apply und also) bzw. ihren Parameter (with) zurück.

#### with

{% highlight java %}
    // "with" ist eine "einfache" Funktion mit einem 'Objekt' als Parameter.
    // "with" führt die Lambda Expression aus, bindet den impliziten "this" Parameter an
    // den Parameter des "with"-Aufrufes und liefert ihr Ergebnis zurück.
    val withRes: String = with(StringBuilder()) {
        this.append(42)
        append("With")  // Wie auch in Methoden kann "this" auch entfallen
        toString()
    }
    println(withRes)   // 42With
{% endhighlight %}

#### apply

{% highlight java %}
    val applyReceiver=StringBuilder()
    val sbRes : StringBuilder = applyReceiver.apply {
        this.append(42)
        append("Apply")  // Wie auch in Methoden kann "this" auch entfallen
        // das "Ergebnis" dieser Lambda Expression ist irrelevant
    }
    println(sbRes)  // 42Apply
{% endhighlight %}

#### also

{% highlight java %}
    val alsoReceiver=StringBuilder()
    val sbRes2 : StringBuilder = alsoReceiver.also {
        // Es gibt hier im Gegensatz zu "apply" kein implizites "this"
        // Stattdessen wird "it" verwendet.
        // Statt des impliziten "it" könnte ein eigener anders benannter Parameter verwendet werden.
        it.append(42)
        it.append("Also")  // Wie auch in Methoden kann "this" auch entfallen
        // das "Ergebnis" dieser Lambda Expression ist irrelevant
    }
    println(sbRes2)   // 42Also
{% endhighlight %}



