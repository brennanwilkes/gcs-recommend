import axios from "axios";
import {Song} from "../types/song";

import "./selector.css";

import FloatingLabel from "react-bootstrap-floating-label";
import SongRow, {getSongKey} from "../SongRow/SongRow";
import {WrappedSongPolaroid} from "../SongPolaroid/SongPolaroid";
import React from "react";

const baseURL = `https://gcs-core-pukl4kbeka-uw.a.run.app`;

interface IProps {
	songChangeCallback: ((songs: Song[]) => void),
	setProcessing: ((state: boolean) => void),
	initialSongs?: Song[],
	generateMode?: boolean
}
interface IState{
	queriedSongs: Song[],
	songs: Song[],
	cogs: boolean[],
}

export default class Selector extends React.Component<IProps, IState> {

	constructor(props: IProps) {
		super(props);
		this.setCog = this.setCog.bind(this);

		this.state = {
			queriedSongs: [],
			songs: this.props.initialSongs ?? [],
			cogs: [false, false, false],
		}
	}

	componentDidUpdate(prevProps: IProps, prevState: IState){
		if(this.state.songs !== prevState.songs){
			this.props.songChangeCallback(this.state.songs);
		}
		if(this.props.initialSongs !== prevProps.initialSongs && this.props.initialSongs){
			this.setState({
				songs: this.props.initialSongs
			});
		}
	}

	handleSearch(event: React.FormEvent, queryParam: string): Promise<Song[]>{
		return new Promise<Song[]>((resolve, reject) => {
			const query = encodeURIComponent((event.target as HTMLTextAreaElement).value);
			if(query){
				axios.get(`${baseURL}/api/v1/search?${queryParam}=${query}`).then(res => {
					resolve(res.data.songs);
				}).catch(reject);
			}
			else {
				resolve([])
			}
		});
	}

	setCog(cog: number, setting: boolean){
		let cogs = this.state.cogs;
		cogs[cog] = setting;
		this.setState({
			cogs: cogs
		});
		this.props.setProcessing(cogs.reduce((prev, cur) => prev || cur));
	}

	render(){

		const querySongsDisplay = this.state.queriedSongs.map((song, i) => <SongRow
			key={getSongKey(song, i)}
			song={song}
			isHoverable={true}
			onClick={(song: Song) => {

				this.setState({
					queriedSongs: [],
					songs: [...this.state.songs, song]
				});
			}}
		/> );


		return <>
			<div className={`Selector container-lg${this.state.cogs.reduce((prev, cur) => prev || cur) ? " SelectorProcessing" : ""}`}>

				<FloatingLabel
					inputClassName="text-gcs-alpine"
					labelClassName="text-gcs-alpine"
					inputStyle={{
						border: "none"
					}}
					onChange={(event) => {
						this.setCog(0,true);
						this.handleSearch(event, "query").then(songs => {
							this.setCog(0,false);
							this.setState({
								queriedSongs: songs
							});
						}).catch(err => {
							this.setCog(0,false);
							console.error(err);
						});
					}}
					label="Search"
					onChangeDelay={500}
					loadingCog={this.state.cogs[0]}
					loadingCogSpinning={this.state.cogs[0]} />



				<div className="searchResultsWrapper container-lg p-0 m-0">
					<ul className="searchResults p-0 mt-n2">{querySongsDisplay}</ul>
				</div>
				<div className="songsDisplay container-fluid row mx-0">{
					this.state.songs.map((song, i) => <WrappedSongPolaroid
						key={getSongKey(song, `main-${i}`)}
						className="col-xl-3 col-lg-4 col-md-6 col-xs-12 mb-0"
						song={song}
						cutoff={32}
						isHoverable={true}
						isDeletable={true}
						onClick={(toDelete: any) => {
							this.setState({
								songs: this.state.songs.filter((s: any) => s.ids[0].id !== toDelete.ids[0].id)
							});
						}}
						keyExtension="selected" />)
				}</div>
			</div>
		</>
	}
}
