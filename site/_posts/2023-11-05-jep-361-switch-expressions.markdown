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
einzelne `case`-Zweige dies nicht tun, was dazu führt, daß Variablen die in den `case`-Zweigen definiert werden im gesamten Kontext
des `switch` gelten und in Konflikt zueinander stehen können. 
<br>Zu guter Letzt konnten switch-Statements bisher nicht mit `null` Werten umgehen, was ab Java 21 mittels eines  `case null`
Case-Zweiges adressiert werden kann (JEP-427 hat dies als *Preview* ab Java 19 bereitgestellt).

Mit Java 14 wurden die `switch`-Expressions final als Feature in die Sprache Java aufgenommen (https://openjdk.org/jeps/361) 
die die vorhandenen switch-Statements im Hinblick auf die o.g. Probleme weiter entwickeln.
<br>Für Java 21 und mit *"Pattern Matching for switch"* (JEP-441) sowie *"Record Patterns"* (JEP-440) wurden dann weitere Verbesserungen für `switch`-Expressions als finales Feature in die Sprache aufgenommen die weiter unten auch kurz vorgestellt werden.

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

    // In diesem Beispiel wird die Expression-Eigenschaft genutzt.
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

Mit Java 21 wurden sowohl JEP-441 ("Pattern matching for switch") als auch JEP-440 ("Record Patterns") final als Feature in die Sprache Java aufgenommen. Während "Pattern matching for switch" sich direkt auf die Erweiterung von switch-Statements/Expressions
bezieht führt der JEP "Record Patterns" das Pattern Matching gegen Records ein mit der Möglichkeit Records anhand ihrer Struktur
zu "zerlegen", wobei dies zunächst nur im Kontext von Patterns für `switch` sowie Pattern Matching für `instanceof` möglich ist.

Im Einzelnen wurden folgende Erweiterungen vorgenommen:

- Case-Label für `switch` wurden so erweitert, so daß auch vollständig qualifizierte Enum-Werte möglich sind und solche Case-Label mit anderen Arten von Case-Labels kombinierbar sind.
- `null` wurde als zusätzlichen konstanten Case-Label zulassen
- `switch` Selector-Expressions erlauben nun eine deutlich größere und flexiblere Anzahl an möglichen Typen die über die bisher möglichen Typen (ganzzahlig ausser long, Enum-Werte und Strings) deutlich hinausgehen. 
- Erweiterung von Case-Labeln um optionale `when` Klauseln die Prädikate darstellen mit denen Case-Zweige weiter differenziert werden können.

mit "Record Patterns" wird es darüber hinaus das Pattern-Matching zur Destrukturierung von Instanzen von Record-Klassen ermöglicht, um einfachere und/oder komplexere Zugriffe auf Records zu ermöglichen.

Im Folgenden soll ein Überblick über diese Features die mit Java 21 final zur Verfügung stehen gegeben werden.

#### Null-Werte

Wie weiter oben schon erwähnt ist es ab Java 21 möglich sowohl in switch-Statements als auch in switch-Expressions das Case-Label `null` zu nutzen,
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

**Um die Abwärtskompatiblität mit existierendem Code zu wahren matcht der Default-Zweig auch weiterhin `null` nicht**

#### Patterns

Ab Java 21 ist es möglich neben konstanten Ausdrücken in Case-Labels auch Typ- und Record-Patterns zu nutzen.
JEP-441 nennt dafür folgende Syntax:

    SwitchLabel:
        case CaseConstant { , CaseConstant }
        case null [, default]
        case Pattern [ Guard ]
        default

Ob ein Case-Zweig mit einem Pattern ausgeführt wird oder nicht wird hier dann nicht mehr wie bisher durch einen Test auf Gleichheit
festgestellt, sondern durch Pattern Matching, wobei hier Typ-Patterns als auch Record-Patterns möglich sind.
Die Aufnahme von Pattern-Matching für `switch` führt dann auch dazu, dass für Selector-Expressions statt wie bisher Ganzzahltypen (ausser long), Strings und Enums nun zusätzlich beliebige Referenztypen möglich sind.
Das folgende Beispiel zeigt ein `switch` mit `null`-Pattern als auch verschiedenen Typ-Patterns.

{% highlight java %}
    // Beispiel aus JEP-441
    record Point(int i, int j) {}
    enum Color { RED, GREEN, BLUE; }

    static void typeTester(Object obj) {
        switch (obj) {
            case null     -> System.out.println("null");
            case String s when s.length > 0 -> System.out.println("String");
            case Color c  -> System.out.println("Color: " + c.toString());
            case Point p  -> System.out.println("Record class: " + p.toString());
            case int[] ia -> System.out.println("Array of ints of length" + ia.length);
            default       -> System.out.println("Something else");
        }
    }
{% endhighlight %}

***Gültigkeitsbereich von in Patterns deklarierten Variablen***

Typ-Patterns deklarieren Variable die an den entsprechend gecasteten Wert der Selector-Expression gebunden werden.
Im Vorausgehenden Beispiel sind dies die Variablen s,c,p und ia. 

Die genannten Variablen sind sowohl in einem ggf. vorhandenen `when`-Guard (s.u.) gültig, als auch auf der rechten Seite
ihres Case-Zweiges.
Definiert ein Case-Label mit Typ-Pattern eine Variable und wird die alte `case L :` Syntax verwendet, die ein "Fallthrough" Verhalten ermöglichen würde, so ist ein "Fallthrough" in diesem Fall nicht erlaubt.

##### Voll qualifizierte Enum-Werte

Wurde in einem `switch` bisher über Enum-Werte entschieden, so musste einerseits die Selector-Expression des switch vom Typ des 
Enum sein und andererseits die Case-Labels Werte aus **diesem** Enum sein. Beisp.:

{% highlight java %}
    public String describeCurrentThreadState() {
        // Thread.State is an Enum
        Thread.State currentThreadState=Thread.currentThread().getState();
        return switch (currentThreadState) {
            case NEW -> "A thread that has not yet started is in this state";
            case RUNNABLE -> "A thread executing in the Java virtual machine is in this state";
            case BLOCKED -> "A thread that is blocked waiting for a monitor lock is in this state";
            case WAITING -> "A thread that is waiting indefinitely for another thread to perform a particular action is in this state";
            case TIMED_WAITING -> "A thread that is waiting for another thread to perform an action for up to a specified waiting time is in this state";
            case TERMINATED -> "A thread that has exited is in this state.";
        };
    }
{% endhighlight %}
    
Jetzt kann der Typ der Selector Expression beliebig sind, daß heisst es kann über beliebige 
Typen entschieden werden. 
Kommen in den Case Zweigen unterschiedliche Enums vor, dann ist es trotzdem möglich ohne Type Patterns auszukommen
weil nun voll qualifizierte Enum-Werte möglich sind und es sogar möglich ist in einem `switch` Case-Zweige mit Enum-Werten und andere
zu mischen. Hierbei ist darauf zu achten, daß die Selector-Expression ein Supertyp der in den Case-Zweigen verwendeten Typen
sein muss.

{% highlight java %}
    sealed interface State permits ActiveState, InactiveState, SpecialState {}
    enum ActiveState implements State { WORKING, WAITING }
    enum InactiveState implements State { STARTING, STOPPING, TERMINATED }
    
    final class SpecialState implements State {
        final public String desc;
        final public boolean urgent;
        
        public SpecialState(String desc, boolean urgent) {
            this.desc=desc; this.urgent=urgent;
        }
    }

    State s=getState();
    String desc=switch (s) {
      case ActiveState.WORKING -> "actively working";
      case ActiveState.WAITING -> "activelty waiting";
      case InactiveState.STARTING -> "starting";
      case InactiveState.STOPPING -> "stopping";
      case InactiveState.TERMINATED -> "terminated";
      case SpecialState state when state.urgent -> "unknown urgent state : %s".formatted(state.desc);
      case SpecialState state -> "unkown state : %s".formatted(state.desc);
    };
{% endhighlight %}

##### Record Patterns

Auch `switch` unterstützt Record-Patterns. Hiermit ist es möglich Records schon beim Pattern-Matching für Switch in ihre Bestandteile zu zerlegen.

{% highlight java %}
    record SeverityAndAction(int severity,String Action) {}

    SeverityAndAction action=getNextAction();
    switch (action) {
      case SeverityAndAction(int s,String a) when s < 10 -> System.out.println("Not Severe! %s".formatted(a));
      case SeverityAndAction(int s,String a) when s > 20 -> System.out.println("Very severe. Urgent! %s".formatted(a));
      case SeverityAndAction(int s,String a) -> System.out.println("Severe. %s".formatted(a));
    }
{% endhighlight %}


`SeverityAndAction(int s,String a)` ist hierbei ein Record-Pattern, das für die Bestandteile des Records eigene lokale Variablen deklariert (hier s und a) und diesen die Werte der entsprechenden Member des Record zuweist.

##### when als 'Guard' für Patterns 

Guards sind zusätzliche Bedingungen in Form von Prädikaten <u>und sind nur nach Patterns erlaubt</u>.

{% highlight java %}
    Runnable mkHandlerFor(Object url) {
        return switch (url) {
            case String s when s.startsWith("http://") -> mkHttpHandler(s);
            case String s when s.startsWith("file://") -> mkFileHandler(s);
            case URL u when u.getProtocol().equals("http") -> mkHttpHandler(u.toExternalForm());
            case URL u when u.getProtocol().equals("file") -> mkFileHandler(u.toExternalForm());
            null -> DEFAULT_HANDLER;
            default -> throw new IllegalArgumentException("Unknown URL-Scheme");
        };
    }
{% endhighlight %}

Das Schlüsselwort `when` leitet den optionalen `Guard` eines Case-Pattern ein und ist ein Boolescher Ausdruck, der 
ausgewertet wird falls das Pattern matcht. Ist der Guard 'true' kommt die rechte Seite des
`case` zum zuge, andernfalls werden die nachfolgenden Case-Zweige geprüft.

##### Case Label Dominanz

Mit der Einführung von Pattern Matching für `switch` kann es vorkommen, das mehr als ein Pattern auf einen Wert matcht
der einem `switch` übergeben wurde. Die Case-Labels werden der Reihenfolge nach auf Übereinstimmung getestet und es kann
vorkommen, daß ein Case-Zweig immer zuerst vor einem anderen übereinstimmt und ihn sozusagen "überdeckt".

Folgendes Beispiel aus JEP-441 verdeutlich dieses als "Case label dominance" benannte Verhalten.

{% highlight java %}
    static void error(Object obj) {
        switch(obj) {
            case CharSequence cs ->
                System.out.println("A sequence of length " + cs.length());
            case String s -> // error: this case label is dominated by a preceding case label
                System.out.println("A string: " + s);
            default -> { break; }
        }
    }
{% endhighlight %}

In diesem Fall kommt es zu einem Compile-Fehler "Label is dominated by a preceeding case label 'CharSequence cs'".

Für Patterns mit `when` Klauseln kann der Compiler nicht entscheiden ob ein Pattern ein anderes "dominiert", so daß für
Patterns mit `when` Klausel nicht geprüft wird, ob sie ein anderes "dominieren". Im vorliegenden Fall
würde, also z.b. ein `when !cs.isEmpty() || cs.isEmpty()` dazu führen, daß der Compile-Fehler verschwindet, obwohl sich
logisch am Code nichts ändert und dieses Case-Label weiterhin den zweiten Case-Zweig dominiert.
JEP-441 empfiehlt daher die Case-Labels wie folgt zu sortieren:

  - konstante Case-Labels
  - Patterns mit `when`
  - Patterns ohne `when`
  
#### Fazit

Die mit Java 14 als Feature eingeführten Switch-Expressions sind eine Verbesserung der vorhandenen Switch-Statements. 
Sie ermöglichen die Verwendung von Switch-Anweisungen als Ausdrücke und verbessern die Code-Lesbarkeit und Wartbarkeit. 
Das zuvor fehlerträchtige "Fall-Through" wird mit Switch-Expressions entschärft indem ein "Fall-Through" in Case-Expressions
nicht erlaubt ist, dafür aber mehrere Werte in einem Case-Zweig geprüft werden können.<br> 
Mit Java 21 kommen weitere Verbesserungen wie das "Pattern Matching for switch" und "Record Patterns" hinzu. 
Diese Features verbessern die Ausdruckstärke sowohl von Switch-Expressions als auch von Switch-Statements deutlich und
ermöglichen es komplexe Logik deutlich kompakter und eleganter umzusetzen. 
