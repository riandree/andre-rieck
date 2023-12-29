---
layout: post
title:  "Sealed Types"
date:   2023-11-01 12:22:00 +0200
categories: java
---

`Sealed Classes` wurden mit JEP-409 final als Feature in die Sprache Java aufgenommen und ermöglichen es die erlaubten Subtypen einer Klasse bzw. eines Interfaces schon bei der
Definition der Klasse (bzw. des Interfaces) anzugeben. 

Mit `Sealed Classes` ist es in Fällen in denen Klassen nicht für eine beliebige Ableitung auch von Drittcode entworfen wurde möglich das <a href="https://de.wikipedia.org/wiki/Fragile_Base_Class_Problem" target="_blank">Fragile Base Class Problem</a> zu umgehen.
`Sealed Classes` eignen sich insbesondere im Zusammenhang mit `record classes` dazu im Rahmen eines eher funktionalen Programmierstils für die Umsetzung <a href="https://en.wikipedia.org/wiki/Algebraic_data_type" target="_blank">Algebraischer Datentypen</a> in Java.


### Sealed Classes und Interfaces 

Eine `Sealed Class`, kann sowohl eine konkrete Klasse, eine abstrakte Klasse oder auch ein Interface sein. 
Das hauptsächliche Ziel von `Sealed Classes` ist es Möglichkeiten der Beschränkung der Vererbung, sowie die Verbesserung des Pattern-Matchings hinsichtlich "vollständiger" Switch-Statements zu unterstützen.. 
Durch die Deklaration einer Klasse bzw. eines Interface als `sealed` erhält man explizite Kontrolle darüber, welche Klassen bzw. Interfaces dieses . 

Als Beispiel sei hier ein Beispiel auf JEP-409 genannt:

{% highlight java %}
    public sealed interface Expr permits ConstantExpr, PlusExpr, TimesExpr, NegExpr { ... }

    public final class ConstantExpr implements Expr { ... }
    public final class PlusExpr     implements Expr { ... }
    public final class TimesExpr    implements Expr { ... }
    public final class NegExpr      implements Expr { ... }
{% endhighlight %}
 
Dieses Beispiel definiert ein `sealed` Interface, das die Schnittstelle eines Objektgraphen darstellt der matematische Ausdrücke mit den Operatoren für
Addition, Negation und Multiplikation sowie für konstante Ausdrücke beschreibt.<br>
Mit dem Schlüsselwort `sealed` wird die Deklaration einer Sealed Class, oder wie hier eines Sealed Interface eingeleitet. Die Kennzeichnung als `sealed` führt dazu,
das das Interface nur von Klassen implementiert werden kann die explizit in der `permits` Klausel genannt sind, d.h. hier ConstantExpr, PlusExpr, TimesExpr sowie NegExpr.<br>
Die nach `permits` genannten Interfaces oder Klassen müssen direkte Subtypen des Sealed-Interface sein und selbst für die Verwendung als Subtyp einer Sealed-Class oder eines Sealed-Interface geeignet sein.<br>

#### Voraussetzung für die Verwendung einer Klasse bzw. eines Interface als Subtyp einer Sealed Class bzw. eines Sealed Interface 

Um die letztgenannte Voraussetzung zu erfüllen und als Subtyp einer Sealed Classe/eines Sealed Interface geeignet zu sein muss eine Klasse bzw. ein Interface selbst entweder
als `sealed`, als `non-sealed` oder als `final` gekennzeichnet sein.
Die Bedeuting dieser Schlüsselwörter ist im Einzelnen :

- **sealed** Eine als `sealed` gekennzeichnete Klasse (oder ein solches Interface) muss eine `permits` Klausel habe in der die Klassen bzw. Interfaces genannt werden denen es erlaubt ist von der `sealed` Class (bzw. dem Sealed Interface) zu erben. Die in der `permits` Klausel genannten Typen müssen direkte Subtypen des `sealed` Typen sein.
- **non-sealed** Markiert Subtypen eines `sealed` Typ die selbst offen für Erweiterungen durch Ableitung oder Implementierung sind. In `switch` Expressions wird dann gegen diesen Typ
und nicht etwa mögliche Subtypen geprüft um sicherzustellen, daß eine Vollständigkeit der `switch`-Expression gegeben ist.
- **final** Hat seine Bedeutung mit der Einführung von Sealed-Classes/Interfaces nicht geändert und verhindert wie bisher, daß von der `final` deklarierten Klasse andere Klassen abgeleitet werden können. **Wichtig** Record Classes sind implizit `final`, so daß bei Verwendung eines `record` als Subtyp eines `sealed` Typen auf die Angabe von `final` verzichtet werden kann. 

Hintergrund der Anforderung, daß alle direkten Subtypen eines `sealed` Type entweder `sealed`, `non-sealed` oder `final` sein müssen ist, daß es auf diese Weise dem Compiler ermöglicht wird für Switch-Expressions über dem `sealed` Typ zu ermitteln, ob der `switch` "vollständig" ist, und somit also alle möglichen Ausprägungen des Typ abdeckt. Beispielsweise könnte der Compiler für folgendes Beispiel feststellen, das ein Case-Zweig für TimesExpr fehlt.

{% highlight java %}
    Expr exp=getExpr();
    switch (exp) {
        case ConstantExpr ce -> { ... } 
        case PlusExpr pe -> { ... } 
        case NegExpr ne -> { ... } 
    }
{% endhighlight %}
 
Hier kann also der Compiler aufgrund der `sealed` Eigenschaft des Expr Interface sicherstellen, daß der Zweig `case TimesExpr te -> { ... }` ergänzt wird und der `switch` vollständig ist. 

Weiterhin ist es notwendig, daß alle Subtypen von `sealed` Klassen oder Interfaces sich im gleichen Module befinden und falls es sich bei dem Module um das *unnamed* Module handelt sich Sealed-Typ und Subtypen im gleichen Package befinden. 

### Fazit

`sealed types` im JDK 17 bieten einen Mechanismus zur Steuerung der Vererbung und Implementierung. Durch die explizite Angabe zulässiger Subtypen  wird es möglich beim Mustervergleich von Case-Expressions die Vollständigkeit sicherzustellen und es werden Probleme mit nicht für die Vererbung vorgesehenen Basisklassen vermieden. Darüber hinaus unterstützen `sealed types` die Umsetzung Algebraischer Datentypen und damit einen eher funktionalen Programmierstil.