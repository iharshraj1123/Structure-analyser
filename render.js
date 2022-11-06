//front end JS
let is_drawing = false;
let sheet = document.getElementsByClassName("sheet-svg")[0]
let sheet_outer = document.getElementsByClassName("sheet-div-outer")[0]
let sheet_insert = document.getElementsByClassName("sheet-svg-insert")[0]
let node_insert = document.getElementsByClassName("sheet-svg-insert-nodes")[0]
let sheet_insert_temp = document.getElementsByClassName("sheet-svg-insert-temp")[0]
let sheet_insert_hinges = document.getElementsByClassName("sheet-svg-insert-hinges")[0]
let toolbar = document.getElementById("toolbar")
let mouseo ={x:0,y:0};
let line_drawing= false;
let node_side= 12;
let node_half_side = node_side/2;
let svg_grid_div = document.getElementsByClassName("sheet-svg-grid")[0];
let one_unit = 26; // = 0.5meters
let temp_x_sticky=0;
let temp_y_sticky=0;
let input_dx= document.getElementsByClassName("coord-dx")[0]
let input_dy= document.getElementsByClassName("coord-dy")[0]
let input_A= document.getElementsByClassName("coord-A")[0]
let input_E= document.getElementsByClassName("coord-E")[0]
let input_I= document.getElementsByClassName("coord-I")[0]
let coord_div= document.getElementsByClassName("co-ord-div")[0];
let magn_div = document.getElementsByClassName("magn-div")[0];
let supp_grp = document.getElementsByClassName("svg-supports")[0];
let load_grp = document.getElementsByClassName("svg-loads")[0];
let result_div= document.getElementsByClassName("Results")[0];
let node_database = [{node_no:0,cx:0,cy:0,support:"none",pointLoad:"none",concMoment:"none"}]
let member_database = [{node1:0,node2:0,length:0,x1:0,y1:0,x2:0,y2:0,I:1,E:1,A:1}]
let load_database = [{node_no:0,type:"pointLoad",magn:5,direction:"theta with our +x axis"}]
let node_click_todo = "none"
let curr_active_node=0;
let was_it_the_node=false;
let past_active_node=1;
let udl_nodes=[]

function update_todo(x){
    if(node_click_todo == x){
        document.getElementsByClassName(`toolbar-button-${x}`)[0].classList.remove("selected-button")
        node_click_todo = "none"
    }
    else{
        if(node_click_todo != "none")document.getElementsByClassName(`toolbar-button-${node_click_todo}`)[0].classList.remove("selected-button")
        document.getElementsByClassName(`toolbar-button-${x}`)[0].classList.add("selected-button")
        node_click_todo = x;
        if(x=="pointLoad"||x=="udl"||x=="concMoment"){
            magn_div.classList.remove("hidemepls")
            if(x!="concMoment") document.getElementsByClassName("mag-deg-div")[0].classList.remove("hidemepls")
            else document.getElementsByClassName("mag-deg-div")[0].classList.add("hidemepls")
        }
    }
}

window.addEventListener('keydown', (e) => {
    switch(e.code){
        case "Escape" : {
            e.preventDefault()
            sheet_insert_temp.innerHTML="";
            is_drawing =false
            if(curr_active_node!=0 && curr_active_node!="none"){
                let last_node = document.getElementsByClassName("node-pt")[curr_active_node-1]
                last_node.style.fill = "rgba(64, 233, 255,0.5)";
            }
            curr_active_node="none";
            update_todo(node_click_todo)
        } break;
    }
});

window.onload = function(){
    setTimeout(addgrids,200)
    if(getCookie("node_database")!=""){
        let temp_node_database = JSON.parse(getCookie("node_database"))
        let temp_load_database = JSON.parse(getCookie("load_database"))
        let temp_member_database = JSON.parse(getCookie("member_database"))
        console.log(temp_node_database)
        curr_active_node=1;

        for(let i=1;i<temp_node_database.length;i++){
            addPoint(temp_node_database[i].cx,temp_node_database[i].cy)
            drawLine()
            if(temp_node_database[i].support != "none") add_support(i,temp_node_database[i].support)
        }
        let node = document.getElementsByClassName("node-pt")
        node[node.length-1].style.fill = "rgba(64, 233, 255,0.5)";
        for(let i=1;i<temp_load_database.length;i++){
            add_loads(temp_load_database[i].node_no,temp_load_database[i].type,temp_load_database[i].magn,temp_load_database[i].direction)
        }
        for(let i=1;i<temp_member_database.length;i++){
            member_database[i].I = temp_member_database[i].I
            member_database[i].A = temp_member_database[i].A
            member_database[i].E = temp_member_database[i].E
        }
    }
}

function addgrids(){
    let svg_metadata = sheet.getBoundingClientRect();
    let temp_axis="";
    for(let i=0;i<(svg_metadata.width/one_unit);i++){
        temp_axis += `<line class="grid-line" x1="${one_unit*i}" y1="0" x2="${one_unit*i}" y2="99999999999" style="" />`;
    }
    for(let i=0;i<(svg_metadata.height/one_unit);i++){
        temp_axis += `<line class="grid-line" x1="0" y1="${one_unit*i}" x2="99999999999" y2="${one_unit*i}" style="" />`;
    }
    svg_grid_div.innerHTML = temp_axis;
}


sheet.addEventListener("mousemove",function(event){
    mouseo.x = event.clientX +sheet_outer.scrollLeft;
    mouseo.y = event.clientY+ sheet_outer.scrollTop;
    let nodes = document.getElementsByClassName("node-pt")
    if(nodes.length>0 && is_drawing){
        let last_node = nodes[curr_active_node-1]
        stickCo_ords(mouseo.x,mouseo.y)
        input_dx.value = roundHalf(((temp_x_sticky - parseInt(last_node.attributes.x.value)-(node_side/2))/one_unit)/2)
        input_dy.value = -roundHalf(((temp_y_sticky - parseInt(last_node.attributes.y.value)-(node_side/2))/one_unit)/2)
        sheet_insert_temp.innerHTML="";
        let temp_x1=add(last_node.attributes.x.value,node_half_side)
        let temp_y1=add(last_node.attributes.y.value,node_half_side)
        let final_text_x=(temp_x1+temp_x_sticky)/2
        let final_text_y=(temp_y1+temp_y_sticky)/2
        if((temp_y_sticky-temp_y1)/(temp_x_sticky-temp_x1)<-0.5) final_text_x -=20
        if(node_click_todo =="none") sheet_insert_temp.insertAdjacentHTML('beforeend', `<line class="temp-member" x1="${temp_x1}" y1="${temp_y1}" x2="${temp_x_sticky}" y2="${temp_y_sticky}" style="stroke:black;stroke-width:2" /><text x="${final_text_x-node_half_side}" y="${final_text_y-node_half_side}" class="svg-member-text">${Math.round(coord_dist(temp_x1,temp_y1,0,temp_x_sticky,temp_y_sticky,0,true)*100)/100} m</text>`);
    }
})

function roundHalf(num) {
    return Math.round(num*2)/2;
}
function applyPoint(){
    let nodes = document.getElementsByClassName("node-pt")
    let last_node = nodes[curr_active_node-1]
    let new_x = parseInt(last_node.attributes.x.value) + parseInt(parseFloat(input_dx.value)*one_unit*2) + node_side/2
    let new_y = (parseInt(last_node.attributes.y.value) - parseInt(parseFloat(input_dy.value)*one_unit*2) + node_side/2)
    console.log(new_x)
    console.log(new_y)
    addPoint(new_x,new_y)
    drawLine()
}

sheet.addEventListener("click",function(event){
    if(node_click_todo == "none"){
        startDraw()
    }
}) 

function startDraw(){
    if(coord_div.classList.contains("hidemepls")) coord_div.classList.remove("hidemepls")
    if(is_drawing){
        if(coord_div.classList.contains("hidemepls")) coord_div.classList.remove("hidemepls")
        stickCo_ords(mouseo.x,mouseo.y)
        addPoint(temp_x_sticky,temp_y_sticky)
        drawLine()
    }
    else{
        //this also occurs for first click 
        if(curr_active_node!="none"){
            is_drawing=true;
            let nodes = document.getElementsByClassName("node-pt")
            stickCo_ords(mouseo.x,mouseo.y)
            if(nodes.length==0){
                //occurs only for first click
                curr_active_node=1;
                addPoint(temp_x_sticky,temp_y_sticky)
                drawLine()
            }
            else{
                //console.log("woo1")
                //occurs when when drawing was stopped then restarted by not clicking on node
                //let last_node = nodes[nodes.length-1]
                let last_node = nodes[curr_active_node-1]
                last_node.style.fill = "red";
                //adding temp member
                let temp_x1 = add(last_node.attributes.x.value,node_half_side)
                let temp_y1 = add(last_node.attributes.y.value,node_half_side)
                sheet_insert_temp.insertAdjacentHTML('beforeend', `<line class="temp-member" x1="${temp_x1}" y1="${temp_y1}" x2="${temp_x_sticky}" y2="${temp_y_sticky}" style="stroke:black;stroke-width:2" /><text x="${(temp_x1+temp_x_sticky)/2}" y="${(temp_y1+temp_y_sticky)/2}" class="svg-member-text">${Math.round(coord_dist(temp_x1,temp_y1,0,temp_x_sticky,temp_y_sticky,0,true)*100)/100} m</text>`);
            }
        }
        else{
           // console.log("woo2")
        }
    }

}

function stickCo_ords(x,y){
    let temp_remx= x % one_unit;
    let temp_remy= (y-toolbar.scrollHeight) % one_unit;

    if(temp_remx > one_unit/2) temp_x_sticky = x + (one_unit-temp_remx)
    else temp_x_sticky = parseInt(x) - temp_remx
    if(temp_remy > one_unit/2) temp_y_sticky = (y-toolbar.scrollHeight) + (one_unit-temp_remy)
    else temp_y_sticky = (y-toolbar.scrollHeight) - temp_remy
}

function add(x,y){
    return parseFloat(x) + parseFloat(y);
}

function addPoint(x,y){
    console.log({x:x,y:y,curr_active_node:curr_active_node})
    let node = document.getElementsByClassName("node-pt")
    if(node.length>0){
        //after first click
        let last_node = node[curr_active_node-1];
        console.log(last_node)
        if(parseInt(x-node_half_side) == parseInt(last_node.attributes.x.value) && parseInt(y-node_half_side) == parseInt(last_node.attributes.y.value)){
            console.log("same node")
            node[past_active_node-1].style.fill = "rgba(64, 233, 255,0.5)";
            node[curr_active_node-1].style.fill = "red";
        }
        else{
            let no_copy_found = true;
            let copy_node_no;
            node_database.forEach(el => {
                if(el.cx == x && el.cy == y){
                    no_copy_found = false;
                    copy_node_no = el.node_no
                    console.log("copy was found")
                }
            })
            last_node.style.fill = "rgba(64, 233, 255,0.5)";
            if(no_copy_found){
                console.log("node added")
                past_active_node=curr_active_node
                curr_active_node = node.length+1
                node_insert.insertAdjacentHTML('beforeend', `<rect onclick="nodeclicko(${node_database.length})" class="node-pt node${node_database.length}" x="${x-node_half_side}" y="${y-node_half_side}" width=${node_side} height=${node_side} style="fill:red;" /><text x="${x-node_half_side}" y="${parseInt(y)+22}" class="svg-node-text">${curr_active_node}</text>`);
                node_database.push({node_no:node.length,x:`${x-node_half_side}`,y:`${y-node_half_side}`,cx:`${x}`,cy:`${y}`})        
            }
            else {
                no_copy_found = true
                past_active_node=curr_active_node
                curr_active_node = copy_node_no
                node[past_active_node-1].style.fill = "rgba(64, 233, 255,0.5)";
                node[curr_active_node-1].style.fill = "red";
            }
       }
    }
    else{
        //for first click
        node_insert.insertAdjacentHTML('beforeend', `<rect onclick="nodeclicko(${node_database.length})" class="node-pt node${node_database.length}" x="${x-node_half_side}" y="${y-node_half_side}" width=${node_side} height=${node_side} style="fill:red;" /><text x="${x-node_half_side}" y="${parseInt(y)+22}" class="svg-node-text">${curr_active_node}</text>`);
        node_database.push({node_no:node.length,x:`${x-node_half_side}`,y:`${y-node_half_side}`,cx:`${x}`,cy:`${y}`})
    }
}


function nodeclicko(node_no){
    if(node_click_todo == "pinned") add_support(node_no,"pinned")
    else if(node_click_todo == "roller") add_support(node_no,"roller")
    else if(node_click_todo == "fixed") add_support(node_no,"fixed")
    else if(node_click_todo == "pointLoad") {
        let magn = document.getElementsByClassName("magn-input")[0].value
        let deg = document.getElementsByClassName("magndeg-input")[0].value
        add_loads(node_no,"pointLoad",magn,deg)
    }
    else if(node_click_todo == "concMoment"){
        let magn = document.getElementsByClassName("magn-input")[0].value
        add_loads(node_no,"concMoment",magn)
    }
    else if(node_click_todo == "udl"){
        if(udl_nodes.length==0){
            udl_nodes[0]=node_no
        }
        else{
            udl_nodes[1]=node_no
            let deg = document.getElementsByClassName("magndeg-input")[0].value
            let magn = document.getElementsByClassName("magn-input")[0].value
            add_loads(node_no,"udl",magn,deg)
        }
    }
    else if(node_click_todo == "hinge"){
        add_support(node_no,"hinge")
    }
    else{
        //setTimeout(function(){ curr_active_node=node_no},50)
        past_active_node=curr_active_node
        curr_active_node=node_no
        console.log("node changed to node" + curr_active_node)
    }
}

function drawLine(){
    line_drawing= true;
    let nodes = document.getElementsByClassName("node-pt")
    if(nodes.length>1){
        let last_node = nodes[curr_active_node-1]
        //let seclast_node = nodes[curr_active_node-2]
        let seclast_node = nodes[past_active_node-1]
        let last_node_x = parseInt(last_node.attributes.x.value)
        let last_node_y = parseInt(last_node.attributes.y.value)
        let seclast_node_x = parseInt(seclast_node.attributes.x.value)
        let seclast_node_y = parseInt(seclast_node.attributes.y.value)
        //use array map here to check for copy nodes
        let no_copynodes= true;
        let last_node_no = nodes.length;
        let early_node_no = node_database[node_database.length-2].node_no
        node_database.forEach(el => {
            if(el.x == last_node_x && el.y == last_node_y && el.node_no != node_database.length-1){
                //console.log({el_x:el.x,el_y:el.x,last_node_x:last_node_x.toString(),last_node_y:last_node_y.toString(),el_node_no:el.node_no,node_database_length_1:node_database.length-1})
                no_copynodes= false;
                last_node_no = el.node_no
                //node_database.pop()
                // document.getElementsByClassName("node-pt")[el.node_no].classList.remove("node-pt")
            }
            if(el.x == seclast_node_x && el.y == seclast_node_y){
                early_node_no = el.node_no
            }
        });
        // if(!no_copynodes){

        // }
        let member_len = coord_dist(last_node_x,last_node_y,0,seclast_node_x,seclast_node_y,0,true)
        // console.log({seclast_node_y:seclast_node_y,last_node_y:last_node_y,mid:(last_node_y+seclast_node_y)/2})
        // console.log({seclast_node_x:seclast_node_x,last_node_x:last_node_x,mid:(last_node_x+seclast_node_x)/2})
        let mem_nos=member_database.length
        member_database.push({member:mem_nos,node1:early_node_no,node2:last_node_no,length: member_len,x1:seclast_node_x,y1:seclast_node_y,x2:last_node_x,y2:last_node_y,I:input_I.value,E:input_E.value,A:input_A.value})
        member_len = Math.round(member_len * 100) / 100
        let text_x1=parseInt(seclast_node_x)
        let text_x2=parseInt(last_node_x)
        let text_y1=parseInt(seclast_node_y)
        let text_y2=parseInt(last_node_y)
        let final_text_x=(text_x1+text_x2)/2
        let final_text_y=(text_y1+text_y2)/2
        if((text_y2-text_y1)/(text_x2-text_x1)<-0.5) final_text_x -=20
        sheet_insert.insertAdjacentHTML('beforeend', `<line onclick="memberclicked(${mem_nos})" onmouseout="mem_mousout(${mem_nos})" onmouseover="mem_mousover(${mem_nos})" class="member member${mem_nos}" x1="${seclast_node_x+node_half_side}" y1="${seclast_node_y+node_half_side}" x2="${last_node_x+node_half_side}" y2="${last_node_y+node_half_side}" style="stroke:black;stroke-width:2" /><text x="${final_text_x}" y="${final_text_y}" class="svg-member-text">${member_len} m</text>`);
    }
}
function mem_mousout(x){
    document.getElementsByClassName(`member${x}`)[0].classList.remove("member-hover")
}
function mem_mousover(x){
    document.getElementsByClassName(`member${x}`)[0].classList.add("member-hover")
}

function coordclose(x){
    if(x==0){
        coord_div.classList.add("hidemepls")
        is_drawing=false;
        sheet_insert_temp.innerHTML="";
        let node = document.getElementsByClassName("node-pt")
        node[node.length-1].style.fill = "rgba(64, 233, 255,0.5)";
    }
    else if (x==1){
        magn_div.classList.add("hidemepls")
        update_todo(node_click_todo);
    }
}

function node2D_dist(l,m,in_units){
    let a = document.getElementsByClassName("node-pt")[l]
    let b = document.getElementsByClassName("node-pt")[m]
    return coord_dist(parseInt(a.attributes.x.value),parseInt(a.attributes.y.value),0,parseInt(b.attributes.x.value),parseInt(b.attributes.y.value),0,in_units)
}

function coord_dist(x1,y1,z1,x2,y2,z2,in_units){
    if(in_units) {return (((Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1)+(z2-z1)*(z2-z1)))/one_unit)/2)}
    else return (Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1)+(z2-z1)*(z2-z1)))
}

function add_support(node_no,type){
    let node = document.getElementsByClassName("node-pt")[node_no-1]
    if(node_database[node_no].support != "none" && node_database[node_no].support != null) document.getElementsByClassName(`support${node_no}`)[0].innerHTML=""
    node_database[node_no].support = type;
    //
    if(type == "pinned"){
        supp_grp.innerHTML += `<g class="support${node_no}" _y="${add(node.attributes.y.value,node_half_side)}" _x="${add(node.attributes.x.value,node_half_side)}" transform="translate(${add(node.attributes.x.value,node_half_side)} ${add(node.attributes.y.value,node_half_side)})"><polyline class="support-poly" points="0,0 6,10 -6,10 0,0" style="fill: gold;stroke-width: 2;stroke:black;"></polyline></g>`
    }
    else if(type == "roller"){
        supp_grp.innerHTML += `<g class="support${node_no}" _y="${add(node.attributes.y.value,node_half_side)}" _x="${add(node.attributes.x.value,node_half_side)}" transform="translate(${add(node.attributes.x.value,node_half_side)} ${add(node.attributes.y.value,node_half_side)})"><polyline class="support-poly" points="0,0 6,10 -6,10 0,0" style="fill: gold;stroke-width: 2;stroke:black;"></polyline><line x1="7.5" y1="14" x2="-7.5" y2="14" style="stroke: black;stroke-width: 2;" class="support-line"></polyline></g>`
    }
    else if(type == "fixed"){
        supp_grp.innerHTML += `<g class="support${node_no}" _y="${add(node.attributes.y.value,node_half_side)}" _x="${add(node.attributes.x.value,node_half_side)}" transform="translate(${add(node.attributes.x.value,node_half_side)} ${add(node.attributes.y.value,node_half_side)})"><g><line class="fixed-line" x1="0" y1="-10" x2="0" y2="10"></line><line class="fixed-line" x1="0" y1="-6" x2="-5" y2="-11"></line><line class="fixed-line" x1="0" y1="0" x2="-10" y2="-10"></line><line class="fixed-line" x1="0" y1="6" x2="-10" y2="-4"></line><line class="fixed-line" x1="-2" y1="10" x2="-10" y2="2"></line><line class="fixed-line" x1="-8" y1="10" x2="-10" y2="8"></line></g></g>`
    }
    else if(type== "hinge"){
        sheet_insert_hinges.innerHTML += `<g class="support${node_no}" _y="${add(node.attributes.y.value,node_half_side)}" _x="${add(node.attributes.x.value,node_half_side)}" transform="translate(${add(node.attributes.x.value,node_half_side)} ${add(node.attributes.y.value,node_half_side)})"><circle r="3.75" cx="0" cy="0" class="hinge"></circle></g>`
    }
}

function add_loads(node_no, type, magn,direc,for_udl){
    if(!direc) direc = 90;
    let node = document.getElementsByClassName("node-pt")[node_no-1]
    //if(node_database[node_no].pointLoad != "none" && node_database[node_no].pointLoad != null) document.getElementsByClassName(`support${node_no}`)[0].innerHTML=""
    if(type == "pointLoad"){
        console.log("pt_load node_no=" + node_no)
        let temp_cy = add(node.attributes.y.value,node_half_side)
        let temp_cx = add(node.attributes.x.value,node_half_side)
        if(node_database[node_no].pointLoad ==null || node_database[node_no].pointLoad.magnitude == 0) node_database[node_no].pointLoad = {x:temp_cx,y:temp_cy,magnitude:magn,direc:direc}
        else node_database[node_no].pointLoad.magnitude = parseFloat(node_database[node_no].pointLoad.magnitude)+ magn
        load_database.push({node_no:node_no,type:"pointLoad",magn:magn,direction:direc})
        if(!for_udl) load_grp.innerHTML+= `<g class="load${node_no}" _y="${temp_cy}" _x="${temp_cx}" transform="rotate(${90-direc} ${temp_cx} ${temp_cy}) translate(${temp_cx} ${temp_cy})"><text x="8" y="-15" class="svg-magn-text">${magn} KN</text><line x1="0" y1="-40" x2="0" y2="-13" class="load-force"></line><polygon points="-6.5,-14 6.5,-14 0,0" class="load-force-head"></polygon></g>`
    }
    else if(type=="concMoment"){
        console.log("moment of "+ magn +" on node_no=" + node_no)
        let temp_cy = add(node.attributes.y.value,node_half_side)
        let temp_cx = add(node.attributes.x.value,node_half_side)
        if(node_database[node_no].concMoment ==null || node_database[node_no].concMoment.magnitude == 0) node_database[node_no].concMoment = {x:temp_cx,y:temp_cy,magnitude:magn}
        else node_database[node_no].concMoment.magnitude = parseFloat(node_database[node_no].concMoment.magnitude)+ magn
        load_database.push({node_no:node_no,type:"concMoment",magn:magn})
        if(!for_udl){
            if(magn>0) load_grp.innerHTML+= `<g class="load${node_no}" _y="${temp_cy}" _x="${temp_cx}" transform="rotate(${90-direc} ${temp_cx} ${temp_cy}) translate(${temp_cx} ${temp_cy})"><text x="20" y="-21" class="svg-magn-text">${magn} KNm</text><g><path d="M-24 0A24 24 0 0 0 21.6 10.4 " class="load-force" transform="rotate(180 0 0)"></path><polygon points="-15.6,-7.7 -27.6,-13.3 -28,2" class="load-force-head"></polygon></g></g>`
            else load_grp.innerHTML+= `<g class="load${node_no}" _y="${temp_cy}" _x="${temp_cx}" transform="rotate(${90-direc} ${temp_cx} ${temp_cy}) translate(${temp_cx} ${temp_cy})"><text x="20" y="-21" class="svg-magn-text">${magn.slice(1)} KNm</text><g><polygon points="15.6,-7.6 27.6,-13.3 28,2" class="load-force-head"></polygon><path d="M24 0A24 24 0 0 1 -21.6 10.4 " class="load-force" transform="rotate(180 0 0)"></path></g></g>`    
        }
   }
    else if(type=="udl"){
        console.log("UDL b/w node_no= "+udl_nodes[0]+"and "+udl_nodes[1])
        let temp_cx_1 = add(document.getElementsByClassName("node-pt")[udl_nodes[0]-1].attributes.x.value,node_half_side)
        let temp_cy_1 = add(document.getElementsByClassName("node-pt")[udl_nodes[0]-1].attributes.y.value,node_half_side)
        let temp_cy_2 = add(node.attributes.y.value,node_half_side)
        let temp_cx_2 = add(node.attributes.x.value,node_half_side)
        let dist_btw_end = coord_dist(temp_cx_1,0,0,temp_cx_2,0,0,false)
        let mem_len = coord_dist(temp_cx_1,temp_cy_1,0,temp_cx_2,temp_cy_2,0,true)
        let no_of_arrows = Math.floor(dist_btw_end/one_unit)
        let dist_btw_arrows = dist_btw_end/no_of_arrows
        let dist_slope = (temp_cy_2-temp_cy_1)/(temp_cx_2-temp_cx_1)
        // let slope_sign=1;
        // if(dist_slope<0) slope_sign=-1;
        let slope_currection=1;
        if(temp_cx_2-temp_cx_1<0) slope_currection=-1;

        let mid_html;
        for(i=0;i<no_of_arrows;i++){
            // mid_html+=`<g><line x1="${(i+1)*dist_btw_arrows}" y1="-40" x2="${(i+1)*dist_btw_arrows}" y2="-13" class="load-force"></line><polygon points="${(i+1)*dist_btw_arrows-6.5},${(i+1)*dist_btw_arrows-14},${(i+1)*dist_btw_arrows+6.6},${(i+1)*dist_btw_arrows-14} ${(i+1)*dist_btw_arrows},${(i+1)*dist_btw_arrows-14}" class="load-force-head"></polygon></g>`
            mid_html+=`<g transform="rotate(${90-direc} ${(i+1)*dist_btw_arrows*slope_currection} ${dist_slope*(i+1)*dist_btw_arrows*slope_currection}) translate(${(i+1)*dist_btw_arrows*slope_currection} ${dist_slope*(i+1)*dist_btw_arrows*slope_currection})"><line x1="0" y1="-40" x2="0" y2="-13" class="load-force"></line><polygon points="-6.5,-14 6.5,-14 0,0" class="load-force-head"></polygon></g>`
        }
        let hide_uniline=""
        if(direc!=90) hide_uniline ="hidemepls"
        let udl_html=`<g transform="translate(${temp_cx_1} ${temp_cy_1})"><line x1="0" y1="-39" x2="${dist_btw_end*slope_currection}" y2="${-39 + dist_slope*dist_btw_end*slope_currection}" class="load-force-uniform hide_uniline"></line><g transform="rotate(${90-direc} 0 0)"><line x1="0" y1="-40" x2="0" y2="-13" class="load-force"></line><polygon points="-6.5,-14 6.5,-14 0,0" class="load-force-head"></polygon></g>${mid_html}<text x="${dist_btw_end*slope_currection/2-5}" y="${-50+dist_slope*dist_btw_end*slope_currection/2}" class="svg-magn-text">${magn} KN/m</text></g>`
        load_grp.innerHTML+= udl_html
        let udl_fem = get_udl_FEM(magn,direc,Math.atan(dist_slope)*180/Math.PI,mem_len)
        let moment_corr = 1;
        if(temp_cx_2-temp_cx_1<0) moment_corr = -1 //when drawing towards left
        console.log({moment_corr:moment_corr})
        add_loads(udl_nodes[0],"concMoment", udl_fem[0]*moment_corr,0,true)
        add_loads(udl_nodes[1],"concMoment", -1*udl_fem[0]*moment_corr,0,true)
        console.log({node1:udl_nodes[0],node2:udl_nodes[1],moment_node1: udl_fem[0]*moment_corr})
        add_loads(udl_nodes[0],"pointLoad", udl_fem[1],90,true)
        add_loads(udl_nodes[1],"pointLoad", udl_fem[1],90,true)
        add_loads(udl_nodes[0],"pointLoad", udl_fem[2],180,true)
        add_loads(udl_nodes[1],"pointLoad", udl_fem[2],180,true)
        udl_nodes=[]
    }
}

function get_udl_FEM(x,udl_deg,mem_deg,L){
    let angle =mem_deg-udl_deg-90
    console.log({x:x,udl_deg:udl_deg,mem_deg:mem_deg,L:L,angle:angle})
    let cos=math.cos(math.unit(angle, 'deg'))
    let sin=math.sin(math.unit(angle, 'deg'))
    let fem = x*cos*L*L*cos*cos/12 + x*cos*L*L*sin*sin/12
    let fef = x*L*math.cos(math.unit(udl_deg-90, 'deg'))/2 //vertical force
    let fef2 = x*L*math.sin(math.unit(udl_deg-90, 'deg'))/2  //horizontal force
    console.log({fem:fem,fef:fef,fef2:fef2})
    return [fem,fef,fef2]
}

function memberclicked(){
    if(false &&node_click_todo=="pointLoad"){
        //stickCo_ords(mouseo.x,mouseo.y)
        stickCo_ords(mouseo.x,mouseo.y)
        addPoint(temp_x_sticky,temp_y_sticky)
        let magn = document.getElementsByClassName("magn-input")[0].value;
        let deg = document.getElementsByClassName("magndeg-input")[0].value
        add_loads(document.getElementsByClassName("node-pt").length,"pointLoad",magn,deg)
    }
}

function clear_svg(){
    sheet_insert.innerHTML = "";
    sheet_insert_hinges.innerHTML=""
    input_dx.value = ""
    input_dy.value = ""
    load_database = [{node_no:0,type:"pointLoad",magn:5,direction:"theta with our +x axis"}]
    supp_grp.innerHTML=""
    load_grp.innerHTML=""
    node_database = [{cx:0,cy:0,support:"none",pointLoad:"none",concMoment:"none"}]
    member_database = [{node1:0,node2:0,length:0,x1:0,y1:0,x2:0,y2:0,I:1,E:1,A:1}]
    temp_x_sticky=0;
    temp_y_sticky=0
    is_drawing=false;
    node_insert.innerHTML="";
    sheet_insert_temp.innerHTML="";
    was_it_the_node=false;
    curr_active_node=0;
    result_div.innerHTML="";extras
    update_todo(node_click_todo)
}

function save_data(){
    setCookie("node_database",JSON.stringify(node_database),999)
    setCookie("load_database",JSON.stringify(load_database),999)
    setCookie("member_database",JSON.stringify(member_database),999)
}

setInterval(function() {
    document.getElementsByClassName("sidebar-debugger")[0].innerHTML = "<h3>curr_active_node</h3>"+ curr_active_node +"<br>"
    document.getElementsByClassName("sidebar-debugger")[0].innerHTML += "<h3>node_database</h3>"+JSON.stringify(node_database) +"<br>"
    document.getElementsByClassName("sidebar-debugger")[0].innerHTML += "<h3>member_database</h3>"+JSON.stringify(member_database)
    document.getElementsByClassName("sidebar-debugger")[0].innerHTML += "<h3>load_database</h3>"+JSON.stringify(load_database)
},200)

/////////////Extras////////////


dragElement(coord_div);
dragElement(magn_div);

function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    // if present, the header is where you move the DIV from:
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    // otherwise, move the DIV from anywhere inside the DIV:
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    // get the mouse cursor position at startup:
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    // call a function whenever the cursor moves:
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    // calculate the new cursor position:
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // set the element's new position:
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    // stop moving when mouse button is released:
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  let expires = "expires="+d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  let name = cname + "=";
  let ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function checkCookie() {
  let user = getCookie("username");
  if (user != "") {
    alert("Welcome again " + user);
  } else {
    user = prompt("Please enter your name:", "");
    if (user != "" && user != null) {
      setCookie("username", user, 365);
    }
  }
} 