import React, { Component } from 'react';
import ReactTable from "react-table";
import Dropdown from 'react-dropdown';
import "react-table/react-table.css";
import './App.css';
import axios from 'axios'
import 'react-dropdown/style.css'
import Popup from "reactjs-popup";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {Line} from 'react-chartjs-2';


// Control all portfolios, their stocks, currency etc.
class PortfolioController extends Component {
  constructor(props) {
    super(props);

    this.state = {
      listOfPortfolios: this.getStorageData(),
      newPortfolio: ''
    };

    this.addPortfolio = this.addPortfolio.bind(this);
    this.deletePortfolio = this.deletePortfolio.bind(this);
    this.addStock = this.addStock.bind(this);
    this.deleteStock = this.deleteStock.bind(this);
    this.handleChangePortfolio = this.handleChangePortfolio.bind(this);
    this.getStorageData = this.getStorageData.bind(this);
    this.updateStocks = this.updateStocks.bind(this);
    this.getData = this.getData.bind(this);
    this.changeRate = this.changeRate.bind(this);
    this.getCurrency = this.getCurrency.bind(this);

    // Update stocks every time constructor is called
    this.updateStocks();
  }

  // Handle the change of text field where user can type the name of new portfolio
  handleChangePortfolio(event) {
    this.setState({
      newPortfolio: event.target.value
    });
  }

  addPortfolio() {
    var i;
    var found = false;
    // Check if there is already portfolio with given name
    for (i=0; i < this.state.listOfPortfolios.length; i++){
      if (this.state.listOfPortfolios[i].name === this.state.newPortfolio) {
        found = true;
      }
    }
    if (this.state.listOfPortfolios.length === 10) {
      alert("Couldn't add a new portfolio. Maximum number of portfolios is 10.");
    }
    // If there already is portfolio with the same name, there will be message to the user that portfolio can't be added
    else if (found || this.state.newPortfolio.length === 0){
      alert("Couldn't add a new portfolio. You have to give a unique name to the new portfolio.");
    }
    // Else the new portfolio will be added
    else {
      const newPortfolio = {
        name: this.state.newPortfolio,
        stocks: [],
        changeRate: 1,
        currency: "USD",
        stockfield: "stock" + this.state.newPortfolio,
        quantityfield: "quantity" + this.state.newPortfolio,
        deletefield: "delete" + this.state.newPortfolio,
        valuefield: "value" + this.state.newPortfolio,
        dropdown: "dropdown" + this.state.newPortfolio,
        valueOfStocks: 0
      };
      var storageData = this.getStorageData();
      storageData.push(newPortfolio);
      localStorage.setItem("portfolios", JSON.stringify(storageData));

      this.setState({
        listOfPortfolios: storageData,
        newPortfolio: ''
      });
    }
  }

  deletePortfolio(name) {
    let portfolios = this.state.listOfPortfolios;
    for (var i=0; i<portfolios.length; i++){
      if (portfolios[i].name === name){
        portfolios.splice(i, 1);
      }
    }

    localStorage.setItem("portfolios", "");
    localStorage.setItem("portfolios", JSON.stringify(portfolios));

    this.setState({
      listOfPortfolios: portfolios
    });
  }

  async addStock(portfolio, stockName, quantity) {
    let portfolios = this.state.listOfPortfolios;
    // Find the right portfolio
    for (var i=0; i<portfolios.length; i++){
      if (portfolios[i].name === portfolio) {
        var index = i;
      }
    }
    var changeRate = portfolios[index].changeRate;
    if (portfolios[index].currency === "USD") {
      changeRate = 1;
    }
    var found = false;
    // Check if there is already stock with given name
    for (var j=0; j < portfolios[index].stocks.length; j++){
      if (portfolios[index].stocks[j].id === stockName.toUpperCase()) {
        found = true;
      }
    }
    if (portfolios[index].stocks.length > 49) {
      alert("Couldn't add a new stock. Maximum number of stocks is 50.");
    }
    // If there already is stock with the same name, there will be message to the user that stock can't be added
    else if (found){
      alert("This stock is already in this portfolio.");
    }
    else if (stockName.length === 0){
      alert("Please give the name of the stock you want to add.");
    }
    else if (isNaN(quantity)){
      alert("Please give a number as a quantity of stocks.");
    }
    else if (quantity < 1){
      alert("Please give a number larger than 0 as a quantity of stocks.");
    }
    // Else the new stock will be added
    else {
      var unitValue = await this.getData(stockName);
      if (unitValue !== undefined) {
        const newStock = {
          "id": stockName.toUpperCase(),
          "unitValue": parseFloat(unitValue * changeRate).toFixed(2),
          "quantity": quantity,
          "totalValue": (unitValue * quantity * changeRate).toFixed(2)
        };
        portfolios[index].stocks.push(newStock);
        var updatedPortfolio = portfolios[index];
        // Add stock value to the total value of all stocks
        updatedPortfolio.valueOfStocks = (parseFloat(updatedPortfolio.valueOfStocks) + parseFloat(newStock.totalValue)).toFixed(2);
        portfolios[index] = updatedPortfolio;

        localStorage.setItem("portfolios", "");
        localStorage.setItem("portfolios", JSON.stringify(portfolios));

        this.setState({
          listOfPortfolios: portfolios
        });
      }
    }
  }

  deleteStock(portfolio, stockName) {
    let portfolios = this.state.listOfPortfolios;
    // Find the right portfolio
    for (var i=0; i<portfolios.length; i++){
      if (portfolios[i].name === portfolio) {
        var j = i;
      }
    }
    // Go through all stocks of the portfolio, find the one that needs to be deleted
    for (var k=0; k<portfolios[j].stocks.length; k++) {
      if (portfolios[j].stocks[k].id === stockName) {
        var updatedPortfolio = portfolios[j];
        // Substract the value of deleted stock from the value of all stocks
        updatedPortfolio.valueOfStocks = (parseFloat(updatedPortfolio.valueOfStocks) - parseFloat(portfolios[j].stocks[k].totalValue)).toFixed(2);
        portfolios[j] = updatedPortfolio;
        // Delete stock using stock index
        portfolios[j].stocks.splice(k, 1);
      }
    }
    localStorage.setItem("portfolios", "");
    localStorage.setItem("portfolios", JSON.stringify(portfolios));

    this.setState({ listOfPortfolios: portfolios });
  }

  // Get data from localstorage
  getStorageData() {
    var jsonHistory = [];
    if (localStorage.getItem('portfolios')) {
      var retrievedObject = localStorage.getItem('portfolios');
      jsonHistory = JSON.parse(retrievedObject);
    }
    return jsonHistory;
  }

  // Change currency between USD and EUR
  async changeRate(portfolio, currency) {
    var valueOfStocks = 0;
    var portfolios = this.state.listOfPortfolios;
    // Find the right portfolio
    for (var i=0; i<portfolios.length; i++){
      if (portfolios[i].name === portfolio) {
        var index = i;
      }
    }
    var data = await this.getCurrency();
    var changeRate = data["rates"]["EUR"];
    if (currency === 'USD') {
        changeRate = 1 / changeRate;
    }
    portfolios[index].changeRate = changeRate;
    portfolios[index].currency = currency;
    // Update currency to all stocks
    for (var j=0; j<portfolios[index].stocks.length; j++) {
      const updatedStock = {
        "id": portfolios[index].stocks[j].id,
        "unitValue": (portfolios[index].stocks[j].unitValue * portfolios[index].changeRate).toFixed(2),
        "quantity": portfolios[index].stocks[j].quantity,
        "totalValue": (portfolios[index].stocks[j].unitValue * portfolios[index].stocks[j].quantity * portfolios[index].changeRate).toFixed(2)
      };
      valueOfStocks = (parseFloat(valueOfStocks) + parseFloat(updatedStock.totalValue)).toFixed(2);
      portfolios[index].stocks[j] = updatedStock;
      localStorage.setItem("portfolios", "");
      localStorage.setItem("portfolios", JSON.stringify(portfolios));
      this.setState({
        listOfPortfolios: portfolios});
    }
    portfolios[index].valueOfStocks = valueOfStocks;
    localStorage.setItem("portfolios", "");
    localStorage.setItem("portfolios", JSON.stringify(portfolios));
    this.setState({ listOfPortfolios: portfolios })
  }

  // Get exhange rate
  async getCurrency(){
    const url = "https://openexchangerates.org/api/latest.json?app_id=6438a59eedb743fea1710706c62f2edc";
    const res = await axios.get(url);
    const { data } = await res;
    return await data;
  }

  async updateStocks() {
    var portfolios = this.state.listOfPortfolios;
    // Go through all portfolios
    for (var i=0; i<portfolios.length; i++) {
      var valueOfStocks = 0;
      var changeRate = 1;
      if (portfolios[i].currency === 'EUR') {
        changeRate = portfolios[i].changeRate
      }
      // Go through all stocks
      for (var j=0; j<portfolios[i].stocks.length; j++) {
        var unitValue = await this.getData(portfolios[i].stocks[j].id);
        const updatedStock = {
          "id": portfolios[i].stocks[j].id,
          "unitValue": (unitValue*changeRate).toFixed(2),
          "quantity": portfolios[i].stocks[j].quantity,
          "totalValue": (unitValue*portfolios[i].stocks[j].quantity*changeRate).toFixed(2)
        };
        valueOfStocks = (parseFloat(valueOfStocks) + parseFloat(updatedStock.totalValue)).toFixed(2);
        portfolios[i].stocks[j] = updatedStock;
        portfolios[i].valueOfStocks = valueOfStocks;
        localStorage.setItem("portfolios", "");
        localStorage.setItem("portfolios", JSON.stringify(portfolios));
        this.setState({
          listOfPortfolios: portfolios});
      }
    }
  }

  // Get stock value
  async getData(id){
    const url = "https://api.iextrading.com/1.0/stock/" + id + "/price";
    try {
      const res = await axios.get(url);
      const {data} = await res;
      return await data;
    } catch(error) {
      alert("Couldn't get the value of stock " + id + ".");
      return
    }
  }

  render() {
  var portfolios = this.state.listOfPortfolios;

    return (
      <div>
        <div className="row">
          <div className="col-10" align="left">
            <input type="text" placeholder="Portfolio name" onChange={this.handleChangePortfolio} value={this.state.newPortfolio}/>
            <input type="submit" className="shadowbutton" value="Add new portfolio" onClick={this.addPortfolio}/>
          </div>
        </div>
        <div className="row">
          {portfolios.map((portfolio, index) =>
            <Portfolio key={portfolios[index].name}
                       name={portfolios[index].name}
                       stocks={portfolios[index].stocks}
                       changeRate={this.changeRate}
                       currency={portfolios[index].currency}
                       deletePortfolio={this.deletePortfolio}
                       addStock={this.addStock}
                       deleteStock={this.deleteStock}
                       stockfield={portfolios[index].stockfield}
                       quantityfield={portfolios[index].quantityfield}
                       deletefield={portfolios[index].deletefield}
                       valuefield={portfolios[index].valuefield}
                       dropdown={portfolios[index].dropdown}
                       valueOfStocks={portfolios[index].valueOfStocks}
                       portfolioChangeRate={portfolios[index].changeRate}/>)}
        </div>
      </div>
    );
  }
}


class Portfolio extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedOption: null,
      columns : [
        {
          Header: "Name",
          accessor: "id"
        },
        {
          Header: "Unit value ",
          accessor: "unitValue"
        },
        {
          Header: "Quantity",
          accessor: "quantity",
        },
        {
          Header: "Total value ",
          accessor: "totalValue"
        }],
      endDate: new Date(),
      startDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)), // one year from now
      labels: [],
      datasets: []
    };
    this.add = this.add.bind(this);
    this.delete = this.delete.bind(this);
    this.handleChangeCurrency = this.handleChangeCurrency.bind(this);
    this.showGraph = this.showGraph.bind(this);
    this.clearGraphData = this.clearGraphData.bind(this);
    this.handleChangeStartDate = this.handleChangeStartDate.bind(this);
    this.handleChangeEndDate = this.handleChangeEndDate.bind(this);
  }

  showGraph(i) {
      let labels = [];
      let datasets = this.state.datasets;
      var dataset = [];

      var changeRate = 1;
      if (this.props.currency === 'EUR') {
        changeRate = this.props.portfolioChangeRate;
      }

      // History of stock values from five years:
      // const url = "https://api.iextrading.com/1.0/stock/" + this.props.stocks[i].id + "/chart/5y";
      // History of stock values from one year:
      const url = "https://api.iextrading.com/1.0/stock/" + this.props.stocks[i].id + "/chart/1y";
      fetch(url)
          .then(res => res.json())
          .then(
              (result) => {
                if (result === {})
                  alert("Couldn't get the data.");
                else {
                  for (var j=0; j<result.length; j++) {
                    // Choose only between the wanted start date and end date
                    if (result[j].date >= this.state.startDate.toISOString().slice(0,10) && result[j].date <= this.state.endDate.toISOString().slice(0,10)) {
                      labels.push(result[j].date);
                      dataset.push(parseFloat(result[j].close)*parseFloat(changeRate));
                    }
                  }
                  // Color of stock in the graph is random
                  var randomColor = require('randomcolor');
                  datasets.push({
                    label: this.props.stocks[i].id,
                    data: dataset,
                    borderColor: randomColor(),
                    spanGaps: true
                  });

                  this.setState({
                    labels: labels,
                    datasets: datasets
                  });
                }
              }
              ,
              (error) => {
                alert("Couldn't get the data.");
              });
  }

  // Set labels and datasets as empty
  clearGraphData() {
    this.setState({
      labels: [],
      datasets: []
    });
  }

  // Call addStock-function with stock name and quantity which user has written
  add() {
    this.props.addStock(this.props.name, document.getElementById(this.props.stockfield).value, document.getElementById(this.props.quantityfield).value);
    document.getElementById(this.props.stockfield).value = '';
    document.getElementById(this.props.quantityfield).value = '';
  }

  // Call deleteStock-function
  delete(stock){
    this.props.deleteStock(this.props.name, stock);
  }

  // Call changeRate-function if user changes the currency-selection
  handleChangeCurrency(selectedCurrency){
    if (selectedCurrency.value !== this.props.currency){
      this.props.changeRate(this.props.name, selectedCurrency.value);
    }

  // Change the start date if user changes it
  }
  handleChangeStartDate(date) {
    this.setState({
      startDate: new Date(date)
    });
  }

  // Change the end date if user changes it
  handleChangeEndDate(date) {
    this.setState({
      endDate: new Date(date)
    });
  }

  render() {
    return (
        <div key={this.props.id} className="col-5 frameborder" align="left">
          <div className="row">
            <div className="inline"> <h2>{this.props.name}</h2> </div>
            <div className="right">
              <button className="deletebutton right" onClick={() => { this.props.deletePortfolio(this.props.name);}}>X</button>
            </div>
          </div>

          <div className="row">
            <ReactTable
                data={this.props.stocks.map(stock => stock)}
                columns={this.state.columns}
                className="-striped -highlight"
                style={{
                  height: "300px",
                }}
            />
            <div className="row">
              <br/>
              Total value: {this.props.valueOfStocks} {this.props.currency}

              <div className="right">
                <Dropdown className="dropdown" options={["EUR", "USD"]} value={this.props.currency} onChange={this.handleChangeCurrency}/>
              </div>
            </div>
            <div className="row">
              <input type="text" size="7" id={this.props.stockfield} placeholder="Stock name"/>
              <input type="text" size="5" id={this.props.quantityfield} placeholder="Quantity"/>
              <button className="shadowbutton" onClick={() => { this.add();}}>Add stock</button>
              <div className="right">
                {<Remove stocks={this.props.stocks} delete={this.delete}/>}
              </div>
            </div>

            <div className="row frameborder">
              <div className="row"><b>Draw a graph from selected time frame (maximum is one year)</b> </div>

              Start date
              <DatePicker
                  selected={this.state.startDate}
                  onChange={this.handleChangeStartDate}/>
              End date
              <DatePicker
                  selected={this.state.endDate}
                  onChange={this.handleChangeEndDate}
              />
              <Popup
                  trigger={<button className="shadowbutton"> Graph </button>}
                  modal
                  closeOnDocumentClick
              >
                <span> {<Graph
                    stocks={this.props.stocks}
                    graphData={this.state.graphData}
                    labels={this.state.labels}
                    datasets={this.state.datasets}
                    showGraph={this.showGraph}
                    clearGraphData={this.clearGraphData}
                    currency={this.props.currency}
                /> } </span>
              </Popup>
            </div>
            </div>
          </div>
    );
  }
}

class Remove extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selectedOption: null,
      data: {
        labels: this.props.labels
      }
    };
    this.handleChangeOption = this.handleChangeOption.bind(this);
    this.callDelete = this.callDelete.bind(this);
  }

  // Changes the selected option to which user selects
  handleChangeOption(selectedOption){
    this.setState({ selectedOption: selectedOption.value });
  }

  // Call delete-function and set selected option as null
  callDelete(){
    this.props.delete(this.state.selectedOption);
    this.setState({ selectedOption: null })
  }

  render() {
    return (
        <div>
          <div className="right">
            <Dropdown className="dropdown" options={this.props.stocks.map(function (stock){ return stock.id})} value={this.state.selectedOption} onChange={this.handleChangeOption} placeholder="Select" />
            <input type="submit" className="shadowbutton" value="Remove" onClick={() => { this.callDelete();}}/>
          </div>
        </div>
    );
  }
}


class Graph extends Component {

  async componentDidMount() {
    // Clear the graph data
    await this.props.clearGraphData();
    // Get the graph data for all stocks of portfolio
    for (var i=0; i<this.props.stocks.length; i++) {
      this.props.showGraph(i);
    }
  }

  render() {
    var data = {
      labels: this.props.labels,
      datasets: this.props.datasets
    };

    return (
      <div>
        <h2>Performance of stocks in {this.props.currency}</h2>
        <Line data={data}/>
      </div>
    );
  }
}


class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="row">
          <PortfolioController />
        </div>
      </div>
    );
  }
}


export default App;
