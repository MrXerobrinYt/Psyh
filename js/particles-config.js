particlesJS("particles-js", {
    particles: {
        number: { value: 120, density: { enable: true, value_area: 800 } },
        color: { value: "#ffffff" },
        shape: { type: "circle" },
        opacity: { value: 0.4, random: true },
        size: { value: 2.5, random: true },
        line_linked: { enable: true, distance: 150, color: "#ffffff", opacity: 0.2, width: 1 },
        move: { enable: true, speed: 2, direction: "none", random: false, out_mode: "out" }
    },
    interactivity: {
        events: { onhover: { enable: true, mode: "repulse" }, onclick: { enable: true, mode: "push" } }
    },
    retina_detect: true
});