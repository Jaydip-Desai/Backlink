
const fs = require("fs");
const path = require("path");

function generateGettersSetters(content) {
    let fields = [];
    const fieldRegex = /private\s+([A-Za-z0-9_<>]+)\s+([a-zA-Z0-9_]+)(\s*=\s*[^;]+)?;/g;
    let match;
    while ((match = fieldRegex.exec(content)) !== null) {
        fields.push({ type: match[1], name: match[2] });
    }
    
    let methods = "";
    fields.forEach(f => {
        const capitalized = f.name.charAt(0).toUpperCase() + f.name.slice(1);
        methods += `
    public ${f.type} get${capitalized}() { return this.${f.name}; }
    public void set${capitalized}(${f.type} ${f.name}) { this.${f.name} = ${f.name}; }`;
        
        if(f.type === "boolean" || f.type === "Boolean") {
            methods += `
    public ${f.type} is${capitalized}() { return this.${f.name}; }`;
        }
    });
    
    // insert methods before last brace
    return content.replace(/}([^}]*)$/, methods + "\n}$1");
}

function processDir(dir) {
    if(!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith(".java")) {
            let content = fs.readFileSync(fullPath, "utf8");
            if (content.includes("@Data")) {
                content = content.replace(/import lombok\.Data;\s*/g, "");
                content = content.replace(/@Data\s*/g, "");
                content = generateGettersSetters(content);
                fs.writeFileSync(fullPath, content);
            }
        }
    });
}

processDir(path.join(__dirname, "src/main/java/com/linkbridge"));
console.log("Lombok removed.");

