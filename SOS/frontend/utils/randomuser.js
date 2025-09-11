import {names} from "../constants/data";
const colors = [
    "#FFCC80",
  "#FFD180",
  "#FFEB3B",
  "#FFF176",
  "#C5E1A5",
  "#81C784",
  "#FFAB91",
  "#FF8A65",
  "#FFB74D",
  "#FF9800",
  "#8BC34A",
  "#4CAF50",
  "#E57373",
  "#EF5350",
  "#FF8A80",
  "#F06292",
  "#BA68C8",
  "#9575CD",
  "#7986CB",
  "#64B5F6",
  "#4FC3F7",
  "#4DD0E1",
  "#4DB6AC",
  "#81C784",
  "#AED581",
  "#DCE775",
  "#FFF59D",
  "#A1887F",
  "#90A4AE",
];

// some random gpt generated names
// const names = [
//     "Lorem Ipsumovich",
//     "Typy McTypeface",
//     "Collabo Rative",
//     "Edito Von Editz",
//     "Wordsworth Writywrite",
//     "Docu D. Mentor",
//     "Scrivener Scribblesworth",
//     "Digi Penman",
//     "Ernest Wordway",
//     "Sir Typalot",
//     "Comic Sans-Serif",
//     "Miss Spellcheck",
//     "Bullet Liston",
//     "Autonomy Backspace",
//     "Ctrl Zedson",
// ];

const getRandomElement = (list) =>
    list[Math.floor(Math.random() * list.length)];

const getRandomColor = () => getRandomElement(colors);
const getRandomName = () => getRandomElement(names);

export const getRandomUser = () => ({
    name: getRandomName(),
    color: getRandomColor(),
});


module.exports = {
    getRandomUser,
    getRandomColor,
    getRandomElement,
    getRandomName
};