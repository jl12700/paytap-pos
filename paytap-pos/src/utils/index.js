export const getRandomBG = () => {
    const colors = [
        "#f6b100",
        "#025cca",
        "#be3e3f",
        "#02ca3a"
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];
    console.log(color);
    return "bg-["+ color +"]";
};

export const getBgColor = () => {
    const bgarr = ["#b73e3e", "#5b45b0", "#7f167f", "#735f32", "#1d2569", "#285430"]
    const randomBg = Math.floor(Math.random() * bgarr.length);
    const color = bgarr[randomBg];
    return color;
};

export const getAvatarName = (name) => {
    if(!name) return "";

    return name.split(" ").map(word[0]).join(" ").toUpperCase();

}

export const formatDate = (date) => {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return `${months[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')},
        ${date.getFullYear()}`;
    };