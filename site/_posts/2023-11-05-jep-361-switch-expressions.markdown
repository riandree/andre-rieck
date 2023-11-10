---
layout: post
title:  "Switch Expression in Java 14 / 21"
date:   2023-11-05 14:42:00 +0200
categories: java
---

Die vom Anbeginn der Sprache Java vorhandenen `switch-Statements` sind sehr eng an die switch-Statements aus C/C++ angelehnt und 
haben einige Probleme. Obwohl switch-Statements in der Praxis oft eingesetzt werden um auf unterschiedliche Weise Werte zu berechnen
ist es bisher nicht möglich gewesen `switch` in einem Expression-Kontext zu verwenden.

Darüber hinaus fällt der Kontrollfluss durch `case`-Zweige hindurch wenn sie nicht durch ein `break` beendet werden. Dieses 
als `Fall-Through` bekannte Verhalten kann bewusst eingesetzt werden um für verschiedene Werte gegen die switch prüft dasselbe 
Verhalten auszuführen. Es besteht jedoch die Gefahr, daß durch vergessene `break`'s teilweise schwer sichtbare Fehler entstehen. 
<br>Manchmal ist auch der Scope relevant den switch aufspannt. Das `switch`-Statement an sich öffnet einen eigenen Scope, während 
einzelne `case`-Zweige dies nicht tun, was dazu führt, daß Variable die in den `case`-Zweigen definiert werden im gesamten Kontext
des `switch` gelten und in Konflikt zueinander stehen können. 
<br>Zu guter Letzt konnten switch-Statements bisher nicht mit `null` Werten umgehen, was ab Java 21 mittels eines  `case null`
Case-Zweiges adressiert werden kann (JEP-427 hat dies als *Preview* ab Java 19 bereitgestellt).

Mit Java 14 wurden die `switch`-Expressions final als Feature in die Sprache Java aufgenommen (https://openjdk.org/jeps/361) 
die die vorhandenen switch-Statements im Hinblick auf die o.g. Probleme weiter entwickeln.
<br>Für Java 21 und mit *"Pattern Matching for switch"* sowie *"Record Patterns"* wurden dann weitere Verbesserungen für `switch`-Expressions als finales Feature in die Sprache aufgenommen die weiter unten auch kurz vorgestellt werden.

### Switch-Expressions

Es ist nun möglich `switch` in einem Expression-Kontext zu verwenden und ohne "Fall Through" Verhalten zu verwenden.
Hierfür ist die `case <Label>(,<Label>)* ->` Syntax zu verwenden, wie nachfolgende Beispiele 
(aus <a href="https://openjdk.org/jeps/361" target="_blank">JEP-361</a>) zeigen. 

{% highlight java %}
    // Hier findet KEIN "Fall through" statt. Die Expression-Eigenschaft wird hier aber nicht genutzt (Der Typ dieser Expression wäre 'Void')
    switch (day) {
        case MONDAY, FRIDAY, SUNDAY -> System.out.println(6);
        case TUESDAY                -> System.out.println(7);
        case THURSDAY, SATURDAY     -> System.out.println(8);
        case WEDNESDAY              -> System.out.println(9);
    }

    // In diesem Beispiel wird Expression-Eigenschaft genutzt.
    int numLetters = switch (day) {
        case MONDAY, FRIDAY, SUNDAY -> 6;
        case TUESDAY                -> 7;
        case THURSDAY, SATURDAY     -> 8;
        case WEDNESDAY              -> 9;
    };
{% endhighlight %}

wie in den Beispielen ersichtlich ist es nun möglich, daß ein Case-Zweig mehrere Werte prüft, so daß es nicht mehr notwendig ist 
hier mit redundatem Code oder "Fall-Through" zu arbeiten. Folgender (alter) Code kann mit dem 2. Beispiel oben deutlich vereinfacht und durch Verzicht auf
"Fall Through" sicherer gemacht werden.

{% highlight java %}
    // Beispiel aus https://openjdk.org/jeps/361
    int numLetters;
    switch (day) {
        case MONDAY:
        case FRIDAY:
        case SUNDAY:
            numLetters = 6;
            break;
        case TUESDAY:
            numLetters = 7;
            break;
        case THURSDAY:
        case SATURDAY:
            numLetters = 8;
            break;
        case WEDNESDAY:
            numLetters = 9;
            break;
        default:
            throw new IllegalStateException("Wat: " + day);
    }
{% endhighlight %}

#### Vollständigkeitsprüfung

Bei der Verwendung von `switch`-Expressions muss für jeden möglichen Wert ein Case-Zweig "matchen", da ansonsten die Expression keinen Wert hätte.

<img src="/assets/images/incompleteSwitchError.png">

Aus diesem Grund führt der Compiler für `switch`-Expressions eine Vollständigkeitsprüfung durch.
Für Enums kann die Vollständigkeit sichergestellt werden, indem alle möglichen Enum-Werte in Case-Zweigen berücksichtigt werden und für
*Sealed Classes* (relevant ab Java 21 / "Pattern Matching for switch" s.u.) indem sämtliche möglichen Typen abgedeckt werden.
Ist dies nicht gewollt, oder wird z.b. gegen `int` geprüft, so kann alternativ ein `default`-Zweig dafür sorgen, das die `switch`-Expression 
vollständig ist.

#### Case-Zweige mit Blocks auf der rechten Seite

Sind zur Berechnung des Wertes eines Case-Zweiges mehrere Statements notwendig, oder soll ein Seiteneffekt wie z.b. für Logging notwendig erziehlt werden,
so kann auf der rechten Seite eines `case L ->` Zweiges statt einer Expression auch ein Block verwendet werden.
In diesem Fall wird der Wert aus diesem Block mittels des Schlüsselwortes `yield` zurückgegeben. Das folgende aus JEP-361 stammende Beispiel verdeutlicht dies.

{% highlight java %}
    int j = switch (day) {
        case MONDAY  -> 0;
        case TUESDAY -> 1;
        default      -> {
            int k = day.toString().length();
            int result = f(k);
            yield result;
        }
    };
{% endhighlight %}

#### Switch Expressions und 'null'

Auch `switch`-Expressions sind bis Java 20 nicht in der Lage mit Null-Werten umzugehen (ausser das ab Java 17 verfügbare Preview Feature
wird aktiviert). Wird dann einer `switch`-Expression `null` übergeben resultiert daraus eine NullPointerException.
Ab Java 21 mit dem "Pattern Matching for switch" Feature können dann sowohl `switch`-Expressions als auch solche Statements mit Nullwerten
umgehen sofern es eine `case null ->` bzw. `case null :` Klausel gibt. Ist dies nicht der Fall resultiert die Übergabe von `null` an `switch`
weiterhin in einer NullPointerException.

#### break und continue in switch-Expressions

In `switch`-Expressions führt die Verwendung von `break` bzw. `continue` zu einem Compilefehler, da ansonsten ggf. kein Wert für die Expression
ermittelt werden könnte. Wie weiter oben schon erwähnt können Blöcke in `switch`-Expressions unter Nutzung des `yield` Keyword und einer Expression
die dann den Wert der `switch`-Expression bestimmt verlassen werden.

## Erweiterungen von switch-Expressions mit Java 21

Im Folgenden soll ein Überblick über die mit Java 21 final zur Verfügung stehenden Features gegeben werden.

#### Null-Werte

Wie weiter oben schon erwähnt ist es ab Java 21 möglich sowohl in switch-Statements als auch in switch-Expressions möglich das Case-Label `null` zu nutzen,
womit ein solches `switch` dann in der Lage ist mit Null-Werten umzugehen. Wird einem `switch` der kein `null` Label hat ein Null-Wert übergeben kommt es weiterhin zu einer NullPointerException.
Das Case-Label `null` ist insofern speziell, als es sich lediglich mit dem `default` Label kombinieren lässt.

{% highlight java %}
    boolean testIfString(Object o) {
        return switch (o) {
            case String s -> {
                System.out.println("Parameter is a String :" + o);
                yield true;
            }
            case null, default -> {
                System.out.println("Not a String :" + o);
                yield false;
            }
        };
    }

    static int parseIntNullAsZero(Object o) {
        return switch (o) {
            case null -> 0;
            case String s when isIntStr(s) -> Integer.parseInt(s);  // Implementierung von isIntStr(String) hier nicht angegeben
            default -> throw new IllegalArgumentException("Parameter is not a String or is not parseable as Integer.");
        };
    }
{% endhighlight %}

#### Type Patterns 

Scope der Pattern Variablen angeben
Dominante case Labels

#### when als 'Guard' für case-Klauseln

#### Voll qualifizierte Enum-Werte

#### Record Patterns

JEP-440





In earlier releases (dies steht im Java 21 "Java Language Updates"), the selector expression must evaluate to a number, string or enum constant, and case labels must be constants. However, in this release, the selector expression can be any reference type or an int type but not a long, float, double, or boolean type, and case labels can have patterns. Consequently, a switch statement or expression can test whether its selector expression matches a pattern, which offers more flexibility and expressiveness compared to testing whether its selector expression is exactly equal to a constant.

record Point(int x, int y) { }
enum Color { RED, GREEN, BLUE; }
...
    static void typeTester(Object obj) {
        switch (obj) {
            case null     -> System.out.println("null");
            case String s -> System.out.println("String");
            case Color c  -> System.out.println("Color with " + c.values().length + " values");
            case Point p  -> System.out.println("Record class: " + p.toString());
            case int[] ia -> System.out.println("Array of int values of length" + ia.length);
            default       -> System.out.println("Something else");
        }
    }

Guarded Patterns :

static void test(Object obj) {
        switch (obj) {
            case String s when s.length() == 1 -> System.out.println("Short: " + s);
            case String s                      -> System.out.println(s);
            default                            -> System.out.println("Not a string");
        }
    }
A guarded patten label has the form p when e where p is a pattern and e is a Boolean expression. The scope of any pattern variable declared in p includes e.

Pattern Label Dominance
It's possible that many pattern labels could match the value of the selector expression. To help predictability, the labels are tested in the order that they appear in the switch block. In addition, the compiler raises an error if a pattern label can never match because a preceding one will always match first.

The following example results in a compile-time error:

Copy
    static void error(Object obj) {
        switch(obj) {
            case CharSequence cs ->
                System.out.println("A sequence of length " + cs.length());
            case String s -> // error: this case label is dominated by a preceding case label
                System.out.println("A string: " + s);
            default -> { break; }
        }
    }

 Guarded patterns aren't checked for dominance because they're generally undecidable. Consequently, you should order your case labels so that constant labels appear first, followed by guarded pattern labels, and then followed by nonguarded pattern labels:

{% highlight java %}
{% endhighlight %}

