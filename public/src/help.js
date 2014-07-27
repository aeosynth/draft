/** @jsx React.DOM */
var Help = React.createClass({
  render() {
    return <div>
<h1>joining games</h1>
<p>
  ask someone for a link to a game
</p>

<h1>creating games</h1>
<p>
  select the number of seats, and the game type
</p>
<p>
  select the sets, or enter the cube decklist
</p>
<p>
  hit 'create', give the link to the players
</p>
<p>
  enable / disable bots
</p>
<p>
  hit 'start' when you are ready
</p>

<h2>cubes</h2>
<p>
  enter both sides of a split card, separated by one or more slashes -
  'fire // ice'
</p>
<p>
  use 'export as text' to get decklists from cube sites
</p>

<h1>drafting</h1>
<p>
  click on a card twice to draft it
</p>
<p>
  when the draft is over, clicking 'draftcap' will show a record of the draft
</p>

<h1>deckbuilding</h1>
<p>
  click a card to toggle it between main and side
</p>
<p>
  move cards to jank by shift clicking
</p>
<p>
  use the ui in the top right to add lands
</p>
<p>
  click 'download' to save the deck to a file, or 'copy' to copy it to your clipboard
</p>
<p>
  a hash is generated on either event, and cannot be changed
</p>

<hr />

<h1>duplicates</h1>
<p>
  this site uses pseudo random numbers to generate packs; it has no knowledge
  of print runs. you can expect a number of duplicate rares and/or mythics per
  draft. let's calculate this number for the original ravnica block, which did
  not contain mythics:
</p>

<a href="http://en.wikipedia.org/wiki/Birthday_problem">http://en.wikipedia.org/wiki/Birthday_problem</a>
<blockquote>In probability theory, the birthday problem or birthday paradox[1]
  concerns the probability that, in a set of n randomly chosen people, some
  pair of them will have the same birthday.</blockquote>

<p>
  the birthday problem is a nice start, but we are concerned with the expected
  number of duplicates, not the probability of a duplicate occuring
</p>

<a href="http://math.stackexchange.com/questions/35791/birthday-problem-expected-number-of-collisions">http://math.stackexchange.com/questions/35791/birthday-problem-expected-number-of-collisions</a>
<blockquote>I am wondering how to find instead the expected number of people
  sharing a birthday in a group of n people.</blockquote>

...

<blockquote>so the expected number of people who share birthdays with somebody
  is n(1−(1−1/N)<sup>n−1</sup>).</blockquote>

<p>
  where N is the number of of equally possible birthdays, and n is the number
  of people. for our purposes, N is the number of rares in the set, and n is
  the number of people drafting
</p>

<p>
  now to plug in some numbers:
</p>

<pre>{`
  n = 8
  N = 88 (RAV), 55 (GPT), 60 (DIS)

  E(RAV) ≈ 0.615
  E(GPT) ≈ 0.964
  E(DIS) ≈ 0.888
  --------------
  E(SUM) ≈ 2.467`}
</pre>

<p>
  so, in an 8 player draft of the original ravnica block, you can expect about
  2.5 duplicate rares per draft
</p>

<h1>draft data</h1>
<a href="https://github.com/aeosynth/draft/wiki/download-draft-results">download draft results</a>

<h1>donate</h1>
<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_top">
  <input type="hidden" name="cmd" value="_s-xclick" />
  <input type="hidden" name="hosted_button_id" value="2ZFX53P7K8ZD8" />
  <input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif" border="0" name="submit" alt="PayPal - The safer, easier way to pay online!" />
  <img alt="" border="0" src="https://www.paypalobjects.com/en_US/i/scr/pixel.gif" width="1" height="1" />
</form>

<h1>contact</h1>
<p>
  <a target="_blank" href="https://github.com/aeosynth/draft/issues">github</a>,
  <a target="_blank" href="https://twitter.com/aeosynth">twitter</a>,
  <a target="_blank" href="mailto:james.r.campos@gmail.com?subject=[draft]">email</a>
</p>
    </div>;
  }
});
