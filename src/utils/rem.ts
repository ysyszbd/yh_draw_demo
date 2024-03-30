const baseSize = 16
export const setRem = () => {
    const scale = document.documentElement.clientWidth / 1080 // 1920是设计稿的宽度
    let fontSize = baseSize * Math.min(scale, 2) > 12 ? baseSize * Math.min(scale, 2) : 12 // 设置页面根节点字体大小，最小12px
    document.documentElement.style.fontSize = fontSize + 'px'
}

const resizeObserve = new ResizeObserver(() => {
    setRem()
})
resizeObserve.observe(document.documentElement)