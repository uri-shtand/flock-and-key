export const cafeOrders = [
  { name: "מיה", request: "A cheese sandwich without tomato, please.", cheese: true, split: false, outcome: "מיה לוקחת ביס ומוצאת שוב את העמוד בספר." },
  { name: "יואב", request: "A cheese sandwich without tomato. Half for now. Half for later.", cheese: true, split: true, outcome: "יואב אוכל חצי אחד ומכניס את החצי הארוז לתיק הטיול." },
  { name: "נטע", request: "A tomato sandwich without cheese, please.", cheese: false, split: false, outcome: "נטע לוקחת את הצלחת לשולחן המפות. המשמרת הסתיימה!" },
] as const;
