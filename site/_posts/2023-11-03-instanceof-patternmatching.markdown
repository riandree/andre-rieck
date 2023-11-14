---
layout: post
title:  "Pattern Matching für instanceof mit Java 16"
date:   2023-11-03 10:21:00 +0200
categories: java
---

In diesem Artikel soll es um das final mit Java 16 mit <a href="https://openjdk.org/jeps/394" target="_blank">JEP-394</a> eingeführte "Pattern Matching for instanceof" Feature gehen.

Aus Sicht der objektoriertierten Programmierung ist die Typprüfung von Objekten zur Laufzeit mit dem Ziel
je nach vorliegendem Typ eines Objektes unterschiedlichen Code auszuführen ein eher unschöner Ansatz.
Auch im Hinblick auf das "Open Closed Principle" des SOLID Akronyms kann die explizite Typprüfung 
dazu führen, daß Code nicht mehr "geschlossen" gegen Änderungen und somit schwerer zu erweitern ist.
In der Praxis kommt es jedoch trozdem vor, daß sich solche Typprüfungen nicht vermeiden lassen, z.b. 
weil eine Library oder eine API mit der gearbeitet werden soll polymorphes Verhalten nicht einfach unterstützt und
der Ansatz über eine Typprüfung mit `instanceof` den pragmatischsten Weg darstellt.

Hier findet sich in Java Code dann immer wieder folgendes das als "instanceof and cast" bekannte Idiom  :

{% highlight java %}
    final SomeBasicType instance2WorkOn = determineOderComputerSomeObject();
    if (instance2WorkOn instanceof SomeSpecialisedSubtype) {
        final SomeSpecialisedSubtype sub=(SomeSpecialisedSubtype)instance2WorkOn;
        // ... do something with casted object ...
    }
    if (instance2WorkOn instanceof OtherSpecialisedSubtype) {
        final OtherSpecialisedSubtype sub=(OtherSpecialisedSubtype)instance2WorkOn;
        // ... do something with casted object ...
    }
    // ... etc. ...
{% endhighlight %}

d.h. es findet eine Typprüfung zur Laufzeit und im Anschluss ein entsprechender Cast statt um dann
auf der gecasteten Referenz zu arbeiten.
In Java 16 wurde mit JEP-394 final das Feature *"Pattern Matching for instanceof"* als Bestandteil von Java aufgenommen,
daß die Typprüfung und den anschliessenden Cast vereinfacht. 

{% highlight java %}
    final SomeBasicType instance2WorkOn = determineOderComputerSomeObject();
    if (instance2WorkOn instanceof SomeSpecialisedSubtype sub) {
        // ... do something with 'SomeSpecialisedSubtype' reference ...
    }
    if (instance2WorkOn instanceof OtherSpecialisedSubtype sub) {
        // ... do something with 'SomeSpecialisedSubtype' reference ...
    }
    // ... etc. ...
{% endhighlight %}

**Hierbei ist darauf zu achten, daß die spezialisierte Variable (hier 'sub') nicht identisch mit der Variable benannt wird gegen die die Typprüfung
ausgeführt wird (hier 'instance2WorkOn'), da dies zu einem Compile-Fehler führt.**

### Komplexere Bedingungen

Es ist in der `instanceof` Expression selbst auch schon möglich auf die dort definierte Referenz des spezialisierten Typ
zuzugreifen, so daß es ohne verschachtelte if-Statements möglich wird weitere Bedingungen zu prüfen, die einen Zugriff auf
den spezialisierten Typ voraussetzen.

{% highlight java %}
    // Beispiel aus : https://openjdk.org/jeps/394
    if (obj instanceof String s && s.length() > 5) {
        flag = s.contains("jdk");
    }
{% endhighlight %}

### Type-Patterns für switch Expressions in Java 21

<a href="/java/2023/11/05/jep-361-switch-expressions.html">Switch Expressions</a> erlauben final als Feature ab Java 21 den Einsatz von 
Type Pattern matching in switch-Expressions analog zum Pattern Matching für instanceof.

### Fazit

Das mit Java 16 nun stabil vorhandene “Pattern Matching for instanceof” Feature stellt eine vom Umfang her übersichtliche, aber durchaus hilfreiche Erweiterung der Sprache dar.
Durch die elegantere Möglichkeit der Typprüfung inklusive des bisher notwendigen Casts hilft es Boilerplate-Code zu reduzieren und die Lesbarkeit des Codes zu verbessern. Insbesondere in Fällen, in denen Typprüfungen unvermeidbar sind, unterstützt *"Pattern Matching for instanceof"*  &nbsp;Entwickler dabei lesbareren Code zu schreiben.