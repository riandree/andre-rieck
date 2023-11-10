---
layout: post
title:  "Text Blocks in Java SE 15"
date:   2023-11-07 11:36:00 +0200
categories: java
---
Bei der Entwicklung von Software ist es häufig notwendig größere Textblöcke 
im Quellcode zu erstellen, die sich über mehrere Zeilen erstrecken und deren
Formatierung exakt vorgegeben werden soll. Hierbei ist es insbesondere oft wichtig
die Einrückung und sonstigen Whitespace zu bewahren. 

### Wofür sind *Text Blocks* gedacht?

Textblöcke sind String-Literale die sich typischerweise über mehrere Zeilen erstrecken
und die die Formatierung im Quellcode stark vereinfachen. 
Zu Java final im Status *Devlivered* als Feature hinzugefügt wurden Textblocks mit <a target="_blank" href="https://openjdk.org/jeps/378">JEP 378 - Text Blocks</a>

`Text Blocks` unterstützen aktuell **nicht direkt** die Interpolation von Werten. Mit Java 21 wird dieses Feature 
als **Preview** im Rahmen des *String Templates* Feature bereitgestellt. Da mit Text Blocks aber auch lediglich 
String-Literale beschrieben werden kann die Methode `String::formatted` verwendet werden um Werte in
Strings zu substituieren.

### Multiline Strings ohne und mit *Text Blocks*

In Quellcode sind beispielsweise das Aufbauen von XML-Fragmenten und SQL Statements zwei oft anzutreffende Anwendungsfälle für mehrzeilige Strings.

{% highlight java %}
    final String xmlData = "<book>\n" +
                 "      <title>Java Programming</title>\n" +
                 "      <author>John Doe</author>\n" +
                 "      <genre>Programming</genre>\n" +
                 "    </book>";

    final String sqlQuery = "SELECT * FROM employees\n" +
                  "     WHERE department = 'HR'\n" +
                  "       AND salary > 50000";
{% endhighlight %}

nicht immer ist die Formatierung hier für die Funktion, wohl aber für die Lesbarkeit relevant.
Es gibt jedoch auch viele Anwendungsfälle wie z.b. die Erstellung von YAML-Markup oder die Generierung
von Python-Code bei denen die Formatierung notwendig für die Funktion ist.
Wie in o.a. Beispielen zu sehen ist die Lesbarkeit und besonders auch die Änderbarkeit durch die Konkatenation der Strings über mehrere Zeilen ungünstig.  

Mit Textblocks sehen die beiden Beispiele nun wie folgt aus:

{% highlight java %}
    String xmlData = """
       <book>
          <title>Java Programming</title>
          <author>John Doe</author>
          <genre>Programming</genre>
       </book>
       """;

    String sqlQuery = """
       SELECT * FROM employees
        WHERE department = 'HR'
          AND salary > 50000
       """;
{% endhighlight %}

### Syntax

Ein Text Block wird immer durch drei doppelte Anführungszeichen `"""` gefolgt von optionalem Whitespace und einem Zeilenumbruch eingeleitet und auch durch `"""` abgeschlossen.
(Auch Kommentare dürfen nicht auf ein öffnendes """ folgen !) 

Die Einrückung der einzelnen Zeilen wird dabei vom abschliessenden `"""` bestimmt.
Zum Beispiel hätte folgender Textblock 

{% highlight java %}
    // Die . stellen hier lediglich die (sonst hier nicht sichtbaren) `Spaces` dar und sind hier als
    // nicht im Code vorhanden zu verstehen.
    String data = """
    ..*
    ...*
    ....*
    .....*
    ..""";
    System.out.print(data);
{% endhighlight %}

den String `*\n.*\n..*\n...*\n` als Ergebnis (auch hier wieder mit `.` als `Space`). 
Soll der String nicht auf einen Zeilenumbruch enden, so kann das abschliessende `"""` direkt im 
Anschluss an das letzte Zeichen begonnen werden z.b.

{% highlight java %}
    String data = """
      I'm
      a multiline
      String""";
{% endhighlight %}

Im folgenden Beispiel werden einige der Eigenschaften von Textblocks demonstriert.

{% highlight java %}
    var firstBlock= """
       THIS IS
         A MULTI // there can be no comments inside text blocks
           LINE STRING
           with additional line breaks\n
           where "single quotes" do not need to be escaped
           three \"""quotes\""" do need to be escaped
       WITH A BACKSLASH \\
       """;
    System.out.print(firstBlock);

    // No trailing linebreak when """ follows on the line of the last character
    var someHTML= """
            <html>
              <body>
                <p>Hello World</p>
              </body>
            </html>""";
    System.out.print(someHTML);
    System.out.println(); // since there is no \n at the end in this case

    // Closing """ determines indentation
    // Substitution can be done using String.formatted
    var someJSON= """
        {
           "version" : %d,
           "language" : "%s",
           "location" : {
              "lat" : "%s",
              "long" : "%s"
           }
        }
     """.formatted(21,"java","53°35'N","09°41'E");
    System.out.print(someJSON);
{% endhighlight %}

Im Ergebis ergibt sich für dieses Codesnippet folgender Output.

<img src="/assets/images/outputTextblocks.png">

### Die Escape Sequenzen \ und \s

Manchmal ist es gewünscht einen Zeilenumbruch der z.b. aus Gründen der Lesbarkeit im Quellcode vorhanden ist, nicht im
Ergebnis zu haben. Da Text Blocks im Normalfall am Ende jeder Zeile einen Zeilenumbruch `\n` einfügen lässt sich dies
mittels eines `\` am Ende einer Zeile eines Textblocks unterdrücken, d.h. ein Zeilenumbruch kann so escaped werden.

Weiterhin wird trailing Whitespace am Ende der Zeilen eines Text Block normalerweise entfernt. Um dieses Verhalten zu 
umgehen kann `\s` verwendet werden, daß als ein Leerzeichen ausgegeben wird, aber geschützt ist, so daß aller Whitespace
davor erhalten bleibt.

### Fazit 

Zusammenfassend lässt sich sagen, daß Text Blocks dazu beitragen können lesbareren und wartungsfreundlicheren Code zu schreiben, da Zeilenumbrüche und Einrückungen auf einfache Weise dargestellt werden und der Bedarf für die Verwendung von Escape-Sequenzen sinkt, da Text Blocks Zeilenumbrüche und Anführungszeichen besser handhaben.
