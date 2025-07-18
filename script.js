class Particle {
    constructor(effect, index){
        this.effect = effect;
        this.index = index;

        this.maxRadius = 20;
        this.minRadius = 1;

        this.radius = Math.floor(Math.random() * (this.maxRadius - this.minRadius) + this.minRadius);
        this.mass = Math.PI * this.radius ** 2;

        this.x = this.radius + Math.random() * (this.effect.width - this.radius * 2);
        this.y = this.radius + Math.random() * (this.effect.height - this.radius * 2);

        this.vx = (Math.random() * 2 - 1);
        this.vy = (Math.random() * 2 - 1);

        this.pushX = 0;
        this.pushY = 0;
    }
    draw(context){
        context.fillStyle = 'hsl(' + this.x / 2 + ', 70%, 50%)';
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
            this.vx *= -1;
        } else if (this.x > this.effect.width - this.radius) {
            this.x = this.effect.width - this.radius;
            this.vx *= -1;
        }
        if (this.y < this.radius){
            this.y = this.radius;
            this.vy *= -1;
        } else if (this.y > this.effect.height - this.radius) {
            this.y = this.effect.height - this.radius;
            this.vy *= -1;
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
        this.collide = true;
        this.connect = true;

        this.maxdistance = 150;
        this.speed = 1;
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

        window.addEventListener('resize', () => {
            effect.resize(window.innerWidth, window.innerHeight);
        });
    }
    updateRadius(radius, bool){
        this.particles.forEach(particle => {
            if (bool){
                particle.maxRadius = radius;
                particle.radius = Math.floor(Math.random() * (radius - particle.minRadius) + particle.minRadius);
            } else {
                particle.radius = radius;
            }
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
            this.particles.push(new Particle(this, this.particles.length + i));
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
    handleParticles(){
        if (this.collide){
            this.collision();
        }
        if (this.connect) {
            this.connectParticles();
        }
        this.particles.forEach(particle => {
            particle.draw(this.context);
            particle.update();
        });
    }
    connectParticles(){
        this.context.strokeStyle = 'white';
        for (let a = 0; a < this.particles.length; a++){
            for (let b = a; b < this.particles.length; b++){
                const dx = this.particles[a].x - this.particles[b].x;
                const dy = this.particles[a].y - this.particles[b].y;
                const distance = Math.hypot(dx, dy);

                if (distance < this.maxdistance){
                    this.context.save();
                    const opacity = 1 - (distance/this.maxdistance);
                    this.context.globalAlpha = opacity;
                    this.context.beginPath();
                    this.context.moveTo(this.particles[a].x, this.particles[a].y);
                    this.context.lineTo(this.particles[b].x, this.particles[b].y);
                    this.context.stroke();
                    this.context.restore();
                }
            }
        }
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
effect.animate();

const numberOfParticles = document.getElementById('nop');
numberOfParticles.value = effect.numberOfParticles;
numberOfParticles.addEventListener('input', (e) => {
    let proceed;
    if (numberOfParticles.value > 100 && !appeared){
        proceed = confirm('You seem to have chosen a very large number for your particles.\n Do you wish to proceed?');
        if (proceed) appeared = true;
        else return;
    }
    effect.updateParticles(numberOfParticles.value);
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
mouseInteractionCheck.addEventListener('input', () => {
    effect.mouse.active = mouseInteractionCheck.checked;
    mouseRadius.parentElement.hidden = !effect.mouse.active;
});

const mouseRadius = document.getElementById('mouseRadius');
mouseRadius.value = effect.mouse.radius;
mouseRadius.parentElement.hidden = !mouseRadius.value;
mouseRadius.addEventListener('input', () => {
    effect.mouse.radius = mouseRadius.value;
});

const radiusCheck = document.getElementById('randomRadius');
const radius = document.getElementById('radius');
radius.value = effect.particles[0].maxRadius;
radius.addEventListener('input', () => {
    effect.updateRadius(radius.value, radiusCheck.checked);
});