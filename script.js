class Particle {
    constructor(effect, index){
        this.effect = effect;
        this.index = index;

        this.maxRadius = 20;
        this.minRadius = 5;

        this.radius = 20;
        this.mass = Math.PI * this.radius ** 2;

        this.x = this.radius + Math.random() * (this.effect.width - this.radius * 2);
        this.y = this.radius + Math.random() * (this.effect.height - this.radius * 2);

        this.vx = (Math.random() * 2 - 1);
        this.vy = (Math.random() * 2 - 1);

        this.pushX = 0;
        this.pushY = 0;
        this.hue = Math.random() * 360;
    }
    draw(context){
        context.fillStyle = 'hsl(' + this.hue + ', 70%, 50%)';
        context.beginPath();
        context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        context.fill();
    }
    update(){
        if (this.effect.mouse.pressed){
            const dx = this.x - this.effect.mouse.x;
            const dy = this.y - this.effect.mouse.y;
            const distance = Math.hypot(dx, dy);
            const force = (this.effect.mouse.radius / distance);

            if(distance < this.effect.mouse.radius){
                const angle = Math.atan2(dy, dx);
                this.pushX += Math.cos(angle) * force;
                this.pushY += Math.sin(angle) * force;
            }
        }
        
        this.x += (this.pushX *= this.effect.friction) + (this.vx * this.effect.speed);
        this.y += (this.pushY *= this.effect.friction) + (this.vy * this.effect.speed);
        
        if (this.x < this.radius){
            this.x = this.radius;
            if (this.vx < 0) this.vx *= -1;
            if (this.pushX < 0) this.pushX *= -1;
        } else if (this.x > this.effect.width - this.radius) {
            this.x = this.effect.width - this.radius;
            if (this.vx > 0) this.vx *= -1;
            if (this.pushX > 0) this.pushX *= -1;
        }
        if (this.y < this.radius){
            this.y = this.radius;
            if (this.vy < 0) this.vy *= -1;
            if (this.pushY < 0) this.pushY *= -1;
        } else if (this.y > this.effect.height - this.radius) {
            this.y = this.effect.height - this.radius;
            if (this.vy > 0) this.vy *= -1;
            if (this.pushY > 0) this.pushY *= -1;
        }
    }
}

class Effect {
    constructor(canvas){
        this.canvas = canvas;
        this.context = canvas.getContext('2d');
        this.context.fillStyle = 'white';
        this.context.strokeStyle = 'white';

        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.createParticles(50);

        //booleans
        this.constRadius = false;
        this.collide = true;
        this.connect = true;

        this.maxdistance = 150;

        this.speed = 1;
        this.radius = this.particles[0].maxRadius;
        this.friction = 0.90;

        this.mouse = {
            x: 0,
            y: 0,
            pressed: false,
            active: true,
            radius: 150,
        };
        
        window.addEventListener('mousemove', e => {
            if (this.mouse.active && this.mouse.pressed){
            this.mouse.x = e.x;
            this.mouse.y = e.y;
            }
        });
        window.addEventListener('mousedown', e => {
            if (this.mouse.active){
            this.mouse.pressed = true;
            this.mouse.x = e.x;
            this.mouse.y = e.y;
            }
        });
        window.addEventListener('mouseup', () => {
            if (this.mouse.active){
            this.mouse.pressed = false;
            }
        });

        window.addEventListener('touchstart', e => {
            if (this.mouse.active && e.touches.length > 0) {
            this.mouse.pressed = true;
            this.mouse.x = e.touches[0].clientX;
            this.mouse.y = e.touches[0].clientY;
            }
        });
        window.addEventListener('touchmove', e => {
            if (this.mouse.active && this.mouse.pressed && e.touches.length > 0) {
            this.mouse.x = e.touches[0].clientX;
            this.mouse.y = e.touches[0].clientY;
            }
        });
        window.addEventListener('touchend', () => {
            if (this.mouse.active){
            this.mouse.pressed = false;
            }
        });

        window.addEventListener('resize', () => {
            effect.resize(window.innerWidth, window.innerHeight);
        });
    }
    resize(width, height){
        this.canvas.width = width;
        this.canvas.height = height;

        this.width = width;
        this.height = height;

        this.context.fillStyle = 'white';
        this.context.strokeStyle = 'white';
    }
    createParticles(count){
        this.particles = [];
        for (let i = 0; i < count; i++){
            this.particles.push(new Particle(this, i));
        }
        this.numberOfParticles = this.particles.length;
    }
    addParticles(count){
        for (let i = 0; i < count; i++){
            const particle = new Particle(this, this.particles.length + i);
            if (this.constRadius){
                particle.radius = this.radius;
            } else {
                particle.radius =  Math.floor(Math.random() * (this.radius) + particle.minRadius);
            }
            particle.mass = particle.mass = Math.PI * particle.radius ** 2;
            this.particles.push(particle);
        }
        this.numberOfParticles = this.particles.length;
    }
    removeParticles(count){
        for (let i = 0; i < count; i++) {
            if (this.particles.length){
                this.particles.pop();
            }
        }
        this.numberOfParticles = this.particles.length;
    }
    updateParticles(newCount){
        const difference = newCount - this.numberOfParticles;
        if (difference > 0){
            this.addParticles(difference);
        } else if (difference < 0){
            this.removeParticles(-difference);
        } else {
            //Do nothing
        }
    }
    updateRadius(bool){
        this.particles.forEach(particle => {
            if (!bool){
                particle.maxRadius = this.radius;
                particle.radius = this.radius;
            } else {
                particle.maxRadius = this.radius;
                particle.radius = Math.floor(Math.random() * (this.radius) + particle.minRadius);
            }

            particle.mass = Math.PI * particle.radius ** 2;
            particle.x = Math.max(particle.radius, Math.min(particle.x, this.width - particle.radius));
            particle.y = Math.max(particle.radius, Math.min(particle.y, this.height - particle.radius));
        });
    }
    handleParticles(){
        if (this.collide || this.connect) this.collision();
        this.particles.forEach(particle => {
            particle.draw(this.context);
            particle.update();
        });
    }
    collision(){
        for (let a = 0; a < this.particles.length; a++){
            for (let b = a; b < this.particles.length; b++){
                const p1 = this.particles[a];
                const p2 = this.particles[b];

                const contact = p1.radius + p2.radius;
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.hypot(dx, dy);

                if (this.collide){
                    if (distance < contact){
                        const nx = dx / distance;
                        const ny = dy / distance;
                        const rvx = p1.vx + p1.pushX - p2.vx - p2.pushX;
                        const rvy = p1.vy + p1.pushY - p2.vy - p2.pushY;
                        const vn = rvx * nx + rvy * ny;
    
                        if (vn < 0) {
                            const impulse = (2 * vn) / (p1.mass + p2.mass);
    
                            p1.vx -= impulse * p2.mass * nx;
                            p1.vy -= impulse * p2.mass * ny;
                            p2.vx += impulse * p1.mass * nx;
                            p2.vy += impulse * p1.mass * ny;
                            
                            const overlap = contact - distance;
                            if (overlap > 0){
                                const totalMass = p1.mass + p2.mass;
                                p1.x -= (overlap * nx) * (p2.mass / totalMass);
                                p1.y -= (overlap * ny) * (p2.mass / totalMass);
                                p2.x += (overlap * nx) * (p1.mass / totalMass);
                                p2.y += (overlap * ny) * (p1.mass / totalMass);
                            }
                        }
                        
                        [p1.hue, p2.hue] = [p2.hue, p1.hue];
                    }
                }

                if (this.connect){
                    if (distance < this.maxdistance){
                        this.context.save();
                        const opacity = 1 - (distance/this.maxdistance);
                        this.context.globalAlpha = opacity;
                        this.context.beginPath();
                        this.context.moveTo(p1.x, p1.y);
                        this.context.lineTo(p2.x, p2.y);
                        this.context.stroke();
                        this.context.restore();
                    }
                }
            }
        }
    }
    animate = () => {
        this.context.clearRect(0,0, this.canvas.width, this.canvas.height);
        this.handleParticles(this.context);
        requestAnimationFrame(this.animate);
    }
}

const canvas = document.getElementById('canvas1');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const effect = new Effect(canvas);
let appeared = false;
let appeared2 = false;
effect.animate();

const numberOfParticles = document.getElementById('nop');
numberOfParticles.value = effect.numberOfParticles;
numberOfParticles.addEventListener('input' , () => {
    let proceed;
    if (numberOfParticles.value > 100 && !appeared){
        proceed = confirm('You seem to have chosen a very large number for your particles.\n Do you wish to proceed?');
        if (proceed) appeared = true;
        else return;
    }
    effect.updateParticles(numberOfParticles.value);
});

const simulationSpeed = document.getElementById('speed');
simulationSpeed.value = effect.speed;
simulationSpeed.addEventListener('input' , () => {
    let proceed2;
    if (simulationSpeed.value > 100 && !appeared2){
        proceed2 = confirm('Are you sure you want your particle going so fast? (you might not be able to see them)');
        if (proceed2) appeared2 = true;
        else return;
    }
    effect.speed = simulationSpeed.value;
});

const collisionCheck = document.getElementById('collision');
effect.collide = collisionCheck.checked;
collisionCheck.addEventListener('input', () => {
    effect.collide = collisionCheck.checked;
});

const connectCheck = document.getElementById('connect');
effect.connect = connectCheck.checked;
connectCheck.addEventListener('input', () => {
    effect.connect = connectCheck.checked;
    connectDistance.parentElement.hidden = !effect.connect;
});

const connectDistance = document.getElementById('connectDistance');
connectDistance.value = effect.maxdistance;
connectDistance.parentElement.hidden = connectCheck.value;
connectDistance.addEventListener('input', () => {
    effect.maxdistance = connectDistance.value;
});

const mouseInteractionCheck = document.getElementById('mouse');
mouseInteractionCheck.checked = effect.mouse.active;
let mouseWasChecked = mouseInteractionCheck.checked;
mouseInteractionCheck.addEventListener('input', () => {
    effect.mouse.active = mouseInteractionCheck.checked;
    mouseRadius.parentElement.hidden = !effect.mouse.active;
    mouseWasChecked = mouseInteractionCheck.checked;
});

const mouseRadius = document.getElementById('mouseRadius');
mouseRadius.value = effect.mouse.radius;
mouseRadius.parentElement.hidden = !mouseRadius.value;
mouseRadius.addEventListener('input', () => {
    effect.mouse.radius = mouseRadius.value;
});

const randomRadiusCheck = document.getElementById('randomRadius');
effect.constRadius = !randomRadiusCheck.checked;
randomRadiusCheck.addEventListener('input', () => {
    effect.constRadius = !randomRadiusCheck.checked;
});

const radius = document.getElementById('radius');
radius.value = effect.particles[0].maxRadius;
radius.addEventListener('input', () => {
    const value = Number(radius.value);
    if (value > 0){
        effect.constRadius = !randomRadiusCheck.checked;
        effect.radius = value;
        effect.updateRadius(randomRadiusCheck.checked);
    }
});

const controlPanel = document.getElementById('control-panel');
controlPanel.addEventListener('mouseenter' ,() => {
    mouseWasChecked = effect.mouse.active;
    effect.mouse.active = false;
});
controlPanel.addEventListener('mouseleave' , () => {
    effect.mouse.active = mouseWasChecked;
});

const hide = document.getElementById('hide');
const collapse = document.getElementById('col');
const collapseSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 124 124" fill="none"><path d="M76.076 9.099 30.932 54.243a4 4 0 0 0 0 5.656l45.144 45.144c2.52 2.52 6.829.735 6.829-2.827v-90.29c0-3.563-4.309-5.347-6.829-2.827" fill="#fff"/></svg>';
const expandSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 124 124" fill="none"><path d="m37.924 110.901 45.144-45.144a4 4 0 0 0 0-5.656L37.924 14.957c-2.52-2.52-6.829-.735-6.829 2.827v90.29c0 3.563 4.309 5.347 6.829 2.827" fill="#fff"/></svg>';
let collapsed = false;
hide.hidden = false;
if (collapse.innerHTML == collapseSVG) {
    collapsed = false;
}
else {
    collapse.innerHTML = collapseSVG;
    collapsed = false;
}
collapse.addEventListener('click', () => {
    if (!collapsed && !hide.hidden){
        collapse.innerHTML = expandSVG;
        hide.hidden = true;
        collapse.style.opacity = 0.3;
        effect.mouse.active = mouseWasChecked;
    }
    else {
        collapse.innerHTML = collapseSVG;
        hide.hidden = false;
        collapse.style.opacity = 1;
        effect.mouse.active = mouseWasChecked;
    }
});