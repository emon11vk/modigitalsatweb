const cases = [
  'A company decides to sponsor an employee bowling team. The cost to form the team is $180 per team member plus a one-time $25 team-registration fee.',
  'An event planner is planning a party. It costs the event planner a onetime fee of $35 to rent the venue and $10.25 per attendee. The event planner has a budget of $300.',
  '$y > 2x - 1\n2x > 5$',
  '$y \\le x\ny \\le -x$',
  'This is math $x+y$ and more math $x = 5$.',
  'What about US$200 and $300?',
  '$x$',
  '$$x$$',
  '$ x $',
  '$180',
];
const regex3 = /(\$\$[\s\S]*?\$\$|\$(?!\s)(?:[^$]*?[^\s$])?\$)/g;
console.log('--- REGEX 3 ---');
cases.forEach(c => console.log(c.match(regex3)));
